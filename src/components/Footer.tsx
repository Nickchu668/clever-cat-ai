const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-muted/30 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo和簡介 */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <span className="text-2xl">🐱</span>
              </div>
              <span className="text-2xl font-bold text-gradient">CatmanAI</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              專業的AI教學平台，幫助你掌握人工智能的力量，提升工作效率和創造力。跟著Catman一起探索AI的無限可能！
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                📧
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                💬
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                📱
              </a>
            </div>
          </div>
          
          {/* 快速連結 */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">學習資源</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">AI基礎課程</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">進階技巧</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">工具指南</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">實戰案例</a></li>
            </ul>
          </div>
          
          {/* 支援 */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">支援</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">常見問題</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">聯絡我們</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">社群支援</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">意見回饋</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border/50 mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 CatmanAI. 版權所有 | 讓AI成為你最好的夥伴 🐱✨</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;