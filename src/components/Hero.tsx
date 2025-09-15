import { Button } from "@/components/ui/button";
import catmanHero from "@/assets/catman-hero.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 背景動畫元素 */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl float-animation"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl float-animation" style={{animationDelay: '3s'}}></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 左側文字內容 */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-gradient">CatmanAI</span>
                <br />
                <span className="text-foreground">教你善用</span>
                <br />
                <span className="text-primary">人工智能</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl">
                跟著Catman一起探索AI的無限可能，從零開始學會如何運用人工智能工具來提升你的工作效率和創造力
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button className="btn-hero">
                🚀 開始學習之旅
              </Button>
              <Button className="btn-ai">
                🤖 探索AI工具
              </Button>
            </div>
            
            {/* 特色標籤 */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
                💡 實用教學
              </span>
              <span className="px-4 py-2 rounded-full bg-accent/10 text-accent-foreground border border-accent/20">
                🎯 步驟詳細
              </span>
              <span className="px-4 py-2 rounded-full bg-secondary/30 text-secondary-foreground border border-secondary/20">
                🔥 最新趨勢
              </span>
            </div>
          </div>
          
          {/* 右側圖片 */}
          <div className="relative">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 pulse-glow"></div>
              <img 
                src={catmanHero} 
                alt="Catman AI 角色 - 戴著未來科技眼鏡的橙色貓咪正在使用電腦學習AI"
                className="relative rounded-3xl shadow-2xl w-full max-w-lg mx-auto transform group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;