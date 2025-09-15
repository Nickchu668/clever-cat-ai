-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create content sections table for admin management
CREATE TABLE public.content_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content items table
CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.content_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for content_sections
CREATE POLICY "Members can view visible sections"
ON public.content_sections
FOR SELECT
TO authenticated
USING (is_visible = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sections"
ON public.content_sections
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for content_items
CREATE POLICY "Members can view items from visible sections"
ON public.content_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.content_sections 
    WHERE id = section_id 
    AND (is_visible = true OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Admins can manage content items"
ON public.content_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Add default member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default content sections
INSERT INTO public.content_sections (name, password, is_visible) VALUES
('Meta 學員專區', 'meta', true),
('加密貨幣專區', 'symptom', true),
('人工智能專區', 'symptom', true),
('功能性網址專區', 'symptom', true);

-- Insert Meta section content
INSERT INTO public.content_items (section_id, title, url, order_index)
SELECT 
  (SELECT id FROM public.content_sections WHERE name = 'Meta 學員專區'),
  title,
  url,
  order_index
FROM (VALUES
  ('EXCEL TO EXCEL', 'https://drive.google.com/file/d/1Z-KrnrWDsd0NvfJZtORnIVO4azTeOtgi/view?usp=sharing', 1),
  ('私人助理', 'https://drive.google.com/file/d/1AF9oCWzf1zlVLKaoBDvj3f4ygGWReb7w/view?usp=sharing', 2),
  ('玄學案例', 'https://drive.google.com/file/d/1nAGrXEntfmAVA6pfcTkplR-MrNZwNrr9/view?usp=sharing', 3),
  ('虛擬KOL', 'https://drive.google.com/file/d/1KO4CE-gt20IlnkWZKAmVVTZHyiBTOz2K/view?usp=drive_link', 4)
) AS t(title, url, order_index);

-- Insert crypto section content
INSERT INTO public.content_items (section_id, title, url, order_index)
SELECT 
  (SELECT id FROM public.content_sections WHERE name = '加密貨幣專區'),
  title,
  url,
  order_index
FROM (VALUES
  ('BTC 持幣情況', 'https://chainexposed.com/HoldWavesRealized.html', 1),
  ('BTC彩虹通道', 'https://www.blockchaincenter.net/en/bitcoin-rainbow-chart/', 2),
  ('BTC彩虹通道 (CBBI)', 'https://colintalkscrypto.com/cbbi/index.html', 3),
  ('BTC 逃頂指數', 'https://www.coinglass.com/zh-TW/pro/i/MA', 4),
  ('BTC熱力圖', 'https://buybitcoinworldwide.com/stats/stock-to-flow/', 5),
  ('BTC預測圖', 'https://coindataflow.com/zh/%E9%A2%84%E6%B5%8B/bitcoin', 6)
) AS t(title, url, order_index);

-- Insert AI section content
INSERT INTO public.content_items (section_id, title, url, order_index)
SELECT 
  (SELECT id FROM public.content_sections WHERE name = '人工智能專區'),
  title,
  url,
  order_index
FROM (VALUES
  ('ChatGPT', 'https://chatgpt.com', 1),
  ('Poe', 'https://poe.com', 2),
  ('豆包', 'https://www.doubao.com/', 3),
  ('CHATGPT MQL5 分析', 'https://chatgpt.com/g/g-dPlAXfGfX-mql5fen-xi-xi-tong', 4)
) AS t(title, url, order_index);

-- Insert tools section content
INSERT INTO public.content_items (section_id, title, url, order_index)
SELECT 
  (SELECT id FROM public.content_sections WHERE name = '功能性網址專區'),
  title,
  url,
  order_index
FROM (VALUES
  ('翻譯軟件', 'https://chromewebstore.google.com/detail/%E6%B2%89%E6%B5%B8%E5%BC%8F%E7%BF%BB%E8%AD%AF-%E7%B6%B2%E9%A0%81%E7%BF%BB%E8%AD%AF%E6%93%B4%E5%85%85-pdf%E7%BF%BB%E8%AD%AF-%E5%85%8D%E8%B2%BB/bpoadfkcbjbfhfodiogcnhhhpibjhbnh?hl=zh-TW&utm_source=ext_sidebar', 1),
  ('查流量註冊', 'https://chromewebstore.google.com/detail/ip-whois-flags-chrome-web/kmdfbacgombndnllogoijhnggalgmkon?hl=zh-TW&utm_source=ext_sidebar', 2),
  ('查鏈協助', 'https://chromewebstore.google.com/detail/metasuites-builders-swiss/fkhgpeojcbhimodmppkbbliepkpcgcoo?hl=zh-TW&utm_source=ext_sidebar', 3),
  ('MetaMask錢包', 'https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?utm_source=ext_app_menu', 4)
) AS t(title, url, order_index);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_sections_updated_at
  BEFORE UPDATE ON public.content_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();