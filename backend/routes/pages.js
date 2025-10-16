import express from 'express';
import { body, validationResult } from 'express-validator';
import Page from '../models/Page.js';
import { authenticateToken } from '../middleware/auth.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Validações
const pageValidation = [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Título deve ter entre 1 e 100 caracteres'),
  body('content').isObject().withMessage('Conteúdo deve ser um objeto válido')
];

// GET /api/pages - Listar páginas do usuário
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = { 
      author: req.user._id,
      ...(search && {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { 'seo.description': { $regex: search, $options: 'i' } }
        ]
      })
    };

    const pages = await Page.find(filter)
      .select('title layout template isPublished createdAt updatedAt aiMetadata')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Page.countDocuments(filter);

    res.json({
      pages,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Erro ao buscar páginas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/pages/:id - Obter página específica
router.get('/:id', async (req, res) => {
  try {
    const page = await Page.findOne({ 
      _id: req.params.id, 
      author: req.user._id 
    });

    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }

    res.json(page);
  } catch (error) {
    console.error('Erro ao buscar página:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/pages - Criar nova página
router.post('/', pageValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, layout = 'default', template = 'basic' } = req.body;

    // Análise da IA
    const aiAnalysis = aiService.analyzeContent(JSON.stringify(content));
    const templateSuggestion = aiService.suggestTemplate(JSON.stringify(content), req.user.behavior?.frequentlyUsedTemplates || []);

    const page = new Page({
      title,
      content,
      layout,
      template: templateSuggestion.template,
      author: req.user._id,
      seo: {
        description: aiAnalysis.suggestions.find(s => s.type === 'seo')?.message || '',
        keywords: aiService.generateTags(JSON.stringify(content)),
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      },
      aiMetadata: {
        recommendedTags: aiService.generateTags(JSON.stringify(content)),
        contentScore: aiAnalysis.score,
        readability: aiAnalysis.metrics.readability || 70,
        lastAnalysis: new Date()
      }
    });

    await page.save();

    // Atualizar histórico do usuário
    await updateUserTemplateHistory(req.user._id, templateSuggestion.template);

    res.status(201).json(page);
  } catch (error) {
    console.error('Erro ao criar página:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/pages/:id - Atualizar página
router.put('/:id', pageValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, layout, template, isPublished } = req.body;

    const page = await Page.findOne({ 
      _id: req.params.id, 
      author: req.user._id 
    });

    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }

    // Atualizar campos
    if (title !== undefined) page.title = title;
    if (content !== undefined) page.content = content;
    if (layout !== undefined) page.layout = layout;
    if (template !== undefined) page.template = template;
    if (isPublished !== undefined) page.isPublished = isPublished;

    // Atualizar análise da IA se o conteúdo mudou
    if (content !== undefined) {
      const aiAnalysis = aiService.analyzeContent(JSON.stringify(content));
      page.aiMetadata = {
        recommendedTags: aiService.generateTags(JSON.stringify(content), page.aiMetadata?.recommendedTags || []),
        contentScore: aiAnalysis.score,
        readability: aiAnalysis.metrics.readability || 70,
        lastAnalysis: new Date()
      };
      
      // Atualizar histórico do usuário
      await updateUserTemplateHistory(req.user._id, template || page.template);
    }

    await page.save();
    res.json(page);
  } catch (error) {
    console.error('Erro ao atualizar página:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/pages/:id - Excluir página
router.delete('/:id', async (req, res) => {
  try {
    const page = await Page.findOneAndDelete({ 
      _id: req.params.id, 
      author: req.user._id 
    });

    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }

    res.json({ message: 'Página excluída com sucesso', deletedId: page._id });
  } catch (error) {
    console.error('Erro ao excluir página:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função auxiliar para atualizar histórico de templates
async function updateUserTemplateHistory(userId, template) {
  try {
    const User = (await import('../models/User.js')).default;
    await User.findByIdAndUpdate(userId, {
      $addToSet: { 
        'behavior.frequentlyUsedTemplates': template 
      },
      $set: { 
        'behavior.lastLogin': new Date() 
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar histórico do usuário:', error);
  }
}

export default router;
