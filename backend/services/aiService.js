class AIService {
  constructor() {
    this.userPatterns = new Map();
    this.contentCache = new Map();
  }

  analyzeContent(content) {
    const text = this.extractText(content);
    const wordCount = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? 
      sentences.reduce((acc, sentence) => acc + sentence.split(/\s+/).length, 0) / sentences.length : 0;

    const suggestions = [];
    let score = 100;

    // Análise de comprimento
    if (wordCount < 50) {
      suggestions.push({
        type: 'length',
        message: 'Conteúdo muito curto. Considere adicionar mais detalhes.',
        priority: 'high',
        scoreImpact: -20
      });
      score -= 20;
    } else if (wordCount > 2000) {
      suggestions.push({
        type: 'length',
        message: 'Conteúdo muito longo. Considere dividir em seções.',
        priority: 'medium',
        scoreImpact: -10
      });
      score -= 10;
    }

    // Análise de estrutura
    const hasHeadings = /<h[1-6]/.test(content);
    if (!hasHeadings) {
      suggestions.push({
        type: 'structure',
        message: 'Adicione títulos (H1-H6) para melhorar a estrutura e SEO.',
        priority: 'high',
        scoreImpact: -15
      });
      score -= 15;
    }

    // Análise de legibilidade
    if (avgSentenceLength > 25) {
      suggestions.push({
        type: 'readability',
        message: 'Frases muito longas. Divida para melhor legibilidade.',
        priority: 'medium',
        scoreImpact: -10
      });
      score -= 10;
    }

    // Análise de links
    const linkCount = (content.match(/<a href=/g) || []).length;
    if (linkCount === 0) {
      suggestions.push({
        type: 'seo',
        message: 'Considere adicionar links relevantes para melhorar a experiência.',
        priority: 'low',
        scoreImpact: -5
      });
      score -= 5;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      suggestions,
      metrics: {
        wordCount,
        sentenceCount: sentences.length,
        avgSentenceLength: Math.round(avgSentenceLength * 100) / 100,
        readability: this.calculateReadabilityScore(text),
        linkCount
      }
    };
  }

  suggestTemplate(content, userHistory = []) {
    const text = this.extractText(content);
    const wordCount = text.split(/\s+/).length;
    const hasImages = /<img/.test(content);
    const hasComplexStructure = /<table|<div class|</section/.test(content);

    let recommendedTemplate = 'basic';
    let confidence = 0.7;

    if (wordCount > 800 && hasImages && hasComplexStructure) {
      recommendedTemplate = 'magazine';
      confidence = 0.9;
    } else if (wordCount > 300 && hasImages) {
      recommendedTemplate = 'professional';
      confidence = 0.8;
    } else if (wordCount <= 150 && !hasImages) {
      recommendedTemplate = 'minimalist';
      confidence = 0.85;
    } else if (hasComplexStructure) {
      recommendedTemplate = 'grid';
      confidence = 0.75;
    }

    // Considerar histórico do usuário
    if (userHistory.length > 0) {
      const templateCounts = userHistory.reduce((acc, template) => {
        acc[template] = (acc[template] || 0) + 1;
        return acc;
      }, {});

      const mostUsed = Object.keys(templateCounts).reduce((a, b) => 
        templateCounts[a] > templateCounts[b] ? a : b, recommendedTemplate
      );

      if (templateCounts[mostUsed] > 2) {
        recommendedTemplate = mostUsed;
        confidence += 0.1;
      }
    }

    return {
      template: recommendedTemplate,
      confidence: Math.min(0.95, confidence),
      reasons: this.getTemplateReasons(recommendedTemplate, wordCount, hasImages)
    };
  }

  generateTags(content, existingTags = []) {
    const text = this.extractText(content).toLowerCase();
    const words = text.split(/\W+/);
    
    const stopWords = new Set([
      'a', 'o', 'as', 'os', 'de', 'da', 'do', 'em', 'para', 'com', 'por', 'que',
      'é', 'como', 'mas', 'se', 'não', 'sim', 'está', 'ser', 'tem', 'há', 'isso',
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
    ]);

    const wordFreq = words.reduce((acc, word) => {
      if (word.length > 3 && !stopWords.has(word) && /^[a-z]+$/.test(word)) {
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {});

    const tags = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

    return [...new Set([...existingTags, ...tags])].slice(0, 10);
  }

  extractText(content) {
    if (typeof content === 'string') {
      // Remove HTML tags
      return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return JSON.stringify(content).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  calculateReadabilityScore(text) {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);
    
    // Flesch Reading Ease simplificado
    let score = 100 - (avgWordsPerSentence * 1.5);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getTemplateReasons(template, wordCount, hasImages) {
    const reasons = {
      basic: ['Template versátil para qualquer tipo de conteúdo'],
      professional: ['Ideal para conteúdo corporativo e documentos formais'],
      creative: ['Perfeito para portfolios e conteúdo visual'],
      minimalist: ['Foco no conteúdo essencial, design limpo'],
      magazine: ['Layout sofisticado para artigos longos e ricos em mídia'],
      grid: ['Organização em grade para conteúdo estruturado']
    };

    const baseReasons = reasons[template] || reasons.basic;
    const specificReasons = [];

    if (wordCount > 500) specificReasons.push(`Otimizado para conteúdo extenso (${wordCount} palavras)`);
    if (hasImages) specificReasons.push('Layout adaptado para conteúdo com imagens');
    if (!hasImages) specificReasons.push('Focado em conteúdo textual');

    return [...baseReasons, ...specificReasons];
  }
}

export default new AIService();
