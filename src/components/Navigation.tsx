import { Button } from "@/components/ui/button";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <span className="text-2xl">🐱</span>
            </div>
            <span className="text-2xl font-bold text-gradient">CatmanAI</span>
          </div>
          
          {/* 導航選單 */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#courses" className="text-foreground hover:text-primary transition-colors duration-200">
              AI課程
            </a>
            <a href="#tools" className="text-foreground hover:text-primary transition-colors duration-200">
              工具推薦
            </a>
            <a href="#community" className="text-foreground hover:text-primary transition-colors duration-200">
              社群
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition-colors duration-200">
              關於我們
            </a>
          </div>
          
          {/* 登入按鈕 */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-foreground hover:text-primary">
              登入
            </Button>
            <Button className="btn-hero text-sm px-6 py-2">
              開始免費試用
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;