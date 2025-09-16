import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Lock, Unlock } from 'lucide-react';

interface ContentSection {
  id: string;
  name: string;
  is_visible: boolean;
}

interface ContentItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  order_index: number;
}

interface SectionData {
  section: ContentSection;
  items: ContentItem[];
  unlocked: boolean;
}

const Dashboard = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [passwords, setPasswords] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSections();
    }
  }, [user]);

  const fetchSections = async () => {
    try {
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('content_sections')
        .select('*')
        .eq('is_visible', true)
        .order('name');

      if (sectionsError) throw sectionsError;

      const sectionsWithItems = await Promise.all(
        sectionsData.map(async (section) => {
          const { data: items, error: itemsError } = await supabase
            .from('content_items')
            .select('*')
            .eq('section_id', section.id)
            .order('order_index');

          if (itemsError) throw itemsError;

          return {
            section,
            items: items || [],
            unlocked: false,
          };
        })
      );

      setSections(sectionsWithItems);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: "載入失敗",
        description: "無法載入內容區域",
        variant: "destructive",
      });
    } finally {
      setLoadingSections(false);
    }
  };

  const handlePasswordSubmit = (sectionId: string, inputPassword: string) => {
    const section = sections.find(s => s.section.id === sectionId);
    if (!section) return;

    const validPasswords = section.section.name === 'Meta 學員專區' 
      ? ['meta', 'symptom'] 
      : ['symptom'];

    if (validPasswords.includes(inputPassword)) {
      setSections(prev => 
        prev.map(s => 
          s.section.id === sectionId 
            ? { ...s, unlocked: true }
            : s
        )
      );
      toast({
        title: "解鎖成功",
        description: `${section.section.name} 已解鎖！`,
      });
    } else {
      toast({
        title: "密碼錯誤",
        description: "請輸入正確的密碼",
        variant: "destructive",
      });
    }
  };

  // Redirect if not authenticated
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  if (loading || loadingSections) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <span className="text-2xl">🐱</span>
              </div>
              <span className="text-2xl font-bold text-gradient">CatmanAI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                歡迎, {user?.email}
              </span>
              {userRole && (
                <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                  {userRole === 'admin' ? '管理員' : '會員'}
                </Badge>
              )}
              <Button onClick={signOut} variant="outline" size="sm">
                登出
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">
            CatmanAI 學習平台
          </h1>
          <p className="text-muted-foreground">
            專教人善用AI的有趣學習平台 - 探索各種AI工具和學習資源
          </p>
        </div>

        <Tabs defaultValue={sections[0]?.section.id} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            {sections.map((sectionData) => (
              <TabsTrigger 
                key={sectionData.section.id} 
                value={sectionData.section.id}
                className="flex items-center space-x-2"
              >
                {sectionData.unlocked ? (
                  <Unlock className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{sectionData.section.name}</span>
                <span className="sm:hidden">{sectionData.section.name.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map((sectionData) => (
            <TabsContent key={sectionData.section.id} value={sectionData.section.id}>
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {sectionData.unlocked ? (
                      <Unlock className="w-5 h-5 text-green-500" />
                    ) : (
                      <Lock className="w-5 h-5 text-red-500" />
                    )}
                    <span>{sectionData.section.name}</span>
                  </CardTitle>
                  <CardDescription>
                    {sectionData.unlocked 
                      ? "已解鎖 - 瀏覽以下資源"
                      : "輸入密碼以解鎖此區域的內容"
                    }
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {!sectionData.unlocked ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`password-${sectionData.section.id}`}>
                          密碼
                        </Label>
                        <div className="flex space-x-2">
                          <Input
                            id={`password-${sectionData.section.id}`}
                            type="password"
                            placeholder="輸入密碼"
                            value={passwords[sectionData.section.id] || ''}
                            onChange={(e) => 
                              setPasswords(prev => ({
                                ...prev,
                                [sectionData.section.id]: e.target.value
                              }))
                            }
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handlePasswordSubmit(
                                  sectionData.section.id, 
                                  passwords[sectionData.section.id] || ''
                                );
                              }
                            }}
                          />
                          <Button
                            onClick={() => 
                              handlePasswordSubmit(
                                sectionData.section.id, 
                                passwords[sectionData.section.id] || ''
                              )
                            }
                            className="btn-hero"
                          >
                            解鎖
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        提示: {sectionData.section.name === 'Meta 學員專區' 
                          ? '密碼為 "meta" 或 "symptom"' 
                          : '密碼為 "symptom"'
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sectionData.items.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          此區域暫無內容
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {sectionData.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors"
                            >
                              <div>
                                <h3 className="font-semibold">{item.title}</h3>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                onClick={() => window.open(item.url, '_blank')}
                                variant="outline"
                                size="sm"
                                className="flex items-center space-x-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>開啟</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;