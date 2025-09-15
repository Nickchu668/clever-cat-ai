import aiPattern from "@/assets/ai-pattern.jpg";

const Features = () => {
  const features = [
    {
      icon: "🎓",
      title: "系統化課程",
      description: "從基礎到進階，循序漸進學會使用各種AI工具，包括ChatGPT、Midjourney、Claude等熱門應用"
    },
    {
      icon: "💼",
      title: "實戰案例",
      description: "真實工作場景應用，學會如何用AI提升工作效率，包括文案寫作、圖片設計、數據分析等"
    },
    {
      icon: "🚀",
      title: "最新趨勢",
      description: "緊跟AI發展前沿，第一時間分享最新工具和技巧，讓你始終保持競爭優勢"
    },
    {
      icon: "👥",
      title: "社群交流",
      description: "加入活躍的學習社群，與同樣熱愛AI的夥伴交流心得，互相學習成長"
    },
    {
      icon: "📱",
      title: "隨時學習",
      description: "支援手機、平板、電腦多平台學習，隨時隨地都能提升你的AI技能"
    },
    {
      icon: "🎯",
      title: "個人化指導",
      description: "根據你的需求和程度，提供客製化學習建議和專業指導"
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 opacity-5">
        <img 
          src={aiPattern} 
          alt="AI pattern background" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            為什麼選擇 <span className="text-gradient">CatmanAI</span>？
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            我們不只是教你使用AI工具，更重要的是培養你的AI思維，讓你能夠靈活運用各種AI技術解決實際問題
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="card-glow p-8 text-center group hover:scale-105 transition-all duration-300"
            >
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* CTA區域 */}
        <div className="text-center mt-16">
          <div className="card-glow p-8 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-4 text-gradient">
              準備好開始你的AI學習之旅了嗎？
            </h3>
            <p className="text-xl text-muted-foreground mb-8">
              立即註冊，獲得專屬學習資源和社群會員資格
            </p>
            <button className="btn-hero">
              🎉 立即免費註冊
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;