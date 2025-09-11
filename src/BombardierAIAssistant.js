import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, Upload, FileText, Image, Search, Zap, Database,
  Camera, BarChart3, Settings, Send, Paperclip, Download, Eye, Trash2,
  Bot, User, Loader2, AlertCircle, Info, Menu, X,
  Brain, Layers, Wrench, Cpu, FileSearch, ImageIcon, Hash, Copy, Star
} from 'lucide-react';

const API_BASE = 'http://localhost:8081/api/v1';

const BombardierAIAssistant = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'system', 
      content: 'Bienvenue dans l\'Assistant IA Bombardier. Je suis votre expert en maintenance ferroviaire et support technique. Comment puis-je vous assister aujourd\'hui ?',
      timestamp: new Date().toLocaleTimeString(),
      service: 'system'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedService, setSelectedService] = useState('chat-answer');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [stores, setStores] = useState(['default', 'maintenance-procedures', 'safety-protocols', 'technical-manuals']);
  const [currentStore, setCurrentStore] = useState('default');

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type, content, metadata = null, service = null) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date().toLocaleTimeString(),
      metadata,
      service
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const callAIService = async (endpoint, data = {}) => {
    try {
      setIsLoading(true);
      
      console.log(`🚀 Calling API: ${API_BASE}${endpoint}`, data);
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error ${response.status}:`, errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`✅ API Response:`, result);
      
      return result;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    } finally {
      try {
        setIsLoading(false);
      } catch (e) {
        console.warn('Component may have been unmounted');
      }
    }
  };

  const formatServiceResponse = (response, serviceType) => {
    console.log(`🔍 Formatting response for service: ${serviceType}`, response);
    
    if (!response) {
      return { content: 'Aucune réponse reçue', metadata: {} };
    }

    if (response.error || !response.success) {
      const errorMsg = response.error?.description || response.message || 'Erreur inconnue';
      return { 
        content: `❌ Erreur: ${errorMsg}`, 
        metadata: response.error || {} 
      };
    }

    let content = '';
    let metadata = response.metadata || {};

    switch (serviceType) {
      case 'chat-answer':
      case 'chat-answer-memory':
        if (response.answer && response.answer.response) {
          content = response.answer.response;
        } else if (response.answer) {
          content = response.answer;
        } else {
          content = 'Réponse vide reçue';
        }
        break;
        
      case 'embedding-get-info':
        if (response.answer && response.answer.response) {
          content = `📚 **Réponse trouvée:**\n\n${response.answer.response}`;
          
          if (response.answer.sources && response.answer.sources.length > 0) {
            content += `\n\n📋 **Sources consultées (${response.answer.sources.length}):**\n`;
            response.answer.sources.forEach((source, index) => {
              content += `\n${index + 1}. **${source.fileName}**\n`;
              if (source.textSegment) {
                const preview = source.textSegment.length > 150 
                  ? source.textSegment.substring(0, 150) + '...' 
                  : source.textSegment;
                content += `   📄 ${preview}\n`;
              }
            });
          }
        } else if (response.answer) {
          content = response.answer;
        } else {
          content = 'Aucun résultat trouvé dans la base de connaissances';
        }
        break;
        
      case 'embedding-query':
        if (response.results) {
          if (response.results.response) {
            content = `🔍 **Réponse trouvée:**\n\n${response.results.response}`;
            
            if (response.results.sources && response.results.sources.length > 0) {
              content += `\n\n📚 **Sources (${response.results.sources.length}):**\n`;
              response.results.sources.forEach((source, index) => {
                content += `\n${index + 1}. **${source.fileName}** (Score: ${(source.individualScore * 100).toFixed(1)}%)\n`;
                if (source.textSegment) {
                  const preview = source.textSegment.length > 150 
                    ? source.textSegment.substring(0, 150) + '...' 
                    : source.textSegment;
                  content += `   📄 ${preview}\n`;
                }
              });
            }
          } else {
            content = 'Aucun résultat trouvé pour cette recherche';
          }
        } else {
          content = 'Recherche effectuée sans résultat';
        }
        break;
        
      case 'sentiment-analyze':
        if (response.sentiment && response.sentiment.response) {
          content = `📊 **Analyse de sentiment:** ${response.sentiment.response}`;
          if (metadata.originalText) {
            content += `\n\n💭 **Texte analysé:** "${metadata.originalText}"`;
          }
        } else if (response.sentiment) {
          content = `📊 **Analyse de sentiment:** ${response.sentiment}`;
        } else {
          content = 'Analyse de sentiment non disponible';
        }
        break;
        
      case 'image-generate':
        if (response.imageUrl && response.imageUrl.response) {
          content = `🎨 **Image générée avec succès!**\n\n📍 **URL:** ${response.imageUrl.response}`;
          metadata.imageUrl = response.imageUrl.response;
        } else if (response.imageUrl && typeof response.imageUrl === 'string') {
          content = `🎨 **Image générée avec succès!**\n\n📍 **URL:** ${response.imageUrl}`;
          metadata.imageUrl = response.imageUrl;
        } else {
          content = 'Image générée mais URL non disponible';
        }
        break;
        
      case 'image-read':
        if (response.analysis && response.analysis.response) {
          content = `🖼️ **Analyse d'image:**\n\n${response.analysis.response}`;
        } else if (response.analysis) {
          content = response.analysis;
        } else {
          content = 'Analyse d\'image non disponible';
        }
        break;
        
      case 'image-read-scanned':
        if (response.extractedText && response.extractedText.pages) {
          content = `📄 **Texte extrait du document:**\n\n`;
          response.extractedText.pages.forEach((page, index) => {
            if (response.extractedText.pages.length > 1) {
              content += `**Page ${page.page || index + 1}:**\n`;
            }
            content += `${page.response}\n\n`;
          });
        } else if (response.extractedText) {
          content = `📄 **Texte extrait:**\n\n${response.extractedText}`;
        } else {
          content = 'Extraction de texte non disponible';
        }
        break;
        
      case 'rag-load-document':
        if (response.answer && response.answer.response) {
          content = `📚 **Analyse du document:**\n\n${response.answer.response}`;
        } else if (response.answer) {
          content = response.answer;
        } else {
          content = 'Document traité par RAG';
        }
        break;
        
      case 'embedding-add-document':
      case 'embedding-add-folder':
        content = `✅ **${response.message || 'Document ajouté avec succès'}**`;
        if (metadata.store) {
          content += `\n📦 **Base:** ${metadata.store}`;
        }
        if (metadata.contextPath) {
          content += `\n📄 **Fichier:** ${metadata.contextPath}`;
        }
        break;
        
      case 'embedding-new-store':
        content = `✅ **${response.message || 'Nouvelle base créée avec succès'}**`;
        if (response.storeName) {
          content += `\n📦 **Nom:** ${response.storeName}`;
        }
        break;
        
      case 'agent-define-prompt-template':
        if (response.response && response.response.response) {
          content = `🤖 **Agent Response:**\n\n${response.response.response}`;
        } else if (response.response) {
          content = response.response;
        } else {
          content = 'Template de prompt défini';
        }
        break;
        
      case 'health-check':
        if (response.status === 'healthy') {
          content = `✅ **Connexion API réussie**\n\n🚀 **Service:** ${response.service || 'Bombardier AI Services'}`;
        } else if (response.success) {
          content = `✅ **API accessible**\n\n🚀 **Service:** ${response.service || 'Bombardier AI Services'}`;
        } else {
          content = '❌ Service non disponible';
        }
        break;
        
      default:
        content = response.answer || response.result || response.message || response.response || 'Réponse reçue';
        if (typeof content === 'object') {
          content = JSON.stringify(content, null, 2);
        }
    }

    return { content, metadata };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    addMessage('user', input);
    const userInput = input;
    setInput('');
    
    try {
      let response;
      let endpoint;
      let requestData = {};

      switch (selectedService) {
        case 'chat-answer':
          endpoint = '/ai-chain/chat/answer';
          requestData = { message: userInput };
          break;
        case 'chat-answer-memory':
          endpoint = '/ai-chain/chat/answer-with-memory';
          requestData = { 
            message: userInput, 
            memoryName: `bombardier-session-${Date.now()}`,
            maxMessages: 10
          };
          break;
        case 'embedding-get-info':
          endpoint = '/ai-chain/embedding/get-info';
          requestData = { query: userInput, store: currentStore };
          break;
        case 'embedding-query':
          endpoint = '/ai-chain/embedding/query';
          requestData = { 
            question: userInput,
            store: currentStore,
            maxResults: 5,
            minScore: 0.7
          };
          break;
        case 'rag-load-document':
          endpoint = '/ai-chain/rag/load-document';
          requestData = { 
            query: userInput,
            contextPath: '/path/to/document.pdf',
            fileType: 'text'
          };
          break;
        case 'sentiment-analyze':
          endpoint = '/ai-chain/sentiment/analyze';
          requestData = { text: userInput };
          break;
        default:
          endpoint = '/ai-chain/chat/answer';
          requestData = { message: userInput };
      }
      
      response = await callAIService(endpoint, requestData);
      const { content, metadata } = formatServiceResponse(response, selectedService);
      addMessage('assistant', content, metadata, selectedService);
      
    } catch (error) {
      console.error('❌ Message handling error:', error);
      addMessage('error', 'Désolé, une erreur est survenue lors du traitement de votre message.');
    }
  };

  const handleFileUpload = async (files, serviceType = 'embedding-add-document') => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    addMessage('system', `📄 Upload du fichier: ${file.name}`, { fileName: file.name, fileSize: file.size });
    
    try {
      let endpoint;
      let requestData = {};
      
      switch (serviceType) {
        case 'embedding-add-document':
          endpoint = '/ai-chain/embedding/add-document';
          requestData = {
            store: currentStore,
            contextPath: file.name,
            maxSegmentSize: 2048,
            maxOverlapSize: 512,
            fileType: 'any'
          };
          break;
        case 'embedding-add-folder':
          endpoint = '/ai-chain/embedding/add-folder';
          requestData = {
            store: currentStore,
            contextPath: file.name,
            maxSegmentSize: 2048,
            maxOverlapSize: 512,
            fileType: 'any'
          };
          break;
        case 'image-read':
          endpoint = '/ai-chain/image/read';
          requestData = {
            prompt: 'Analysez cette image technique et identifiez les composants.',
            contextURL: URL.createObjectURL(file)
          };
          break;
        case 'image-read-scanned':
          endpoint = '/ai-chain/image/read-scanned';
          requestData = {
            prompt: 'Effectuez une extraction OCR complète de ce document.',
            filePath: file.name
          };
          break;
        default:
          endpoint = '/ai-chain/embedding/add-document';
          requestData = {
            store: currentStore,
            contextPath: file.name
          };
      }
      
      const response = await callAIService(endpoint, requestData);
      const { content, metadata } = formatServiceResponse(response, serviceType);
      
      addMessage('assistant', content, metadata, serviceType);
      
      setDocuments(prev => [...prev, {
        id: Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        processed: new Date(),
        service: serviceType,
        success: response.success
      }]);
      
    } catch (error) {
      console.error('❌ File upload error:', error);
      addMessage('error', `Erreur lors du traitement du fichier: ${error.message}`);
    }
  };

  const quickActions = [
    {
      label: 'Procédure Freinage',
      icon: <Wrench className="w-4 h-4" />,
      action: () => setInput('Quelle est la procédure de vérification des systèmes de freinage Bombardier ?'),
      color: 'bg-blue-500'
    },
    {
      label: 'Diagnostic Hydraulique',
      icon: <Search className="w-4 h-4" />,
      action: () => setInput('Comment diagnostiquer une anomalie dans le circuit hydraulique ?'),
      color: 'bg-green-500'
    },
    {
      label: 'Manuel Sécurité',
      icon: <FileText className="w-4 h-4" />,
      action: () => setInput('Montrez-moi les protocoles de sécurité pour la maintenance'),
      color: 'bg-orange-500'
    },
    {
      label: 'Analyse Capteur',
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => setInput('Analysez les données des capteurs de température'),
      color: 'bg-purple-500'
    }
  ];

  const aiServices = [
    {
      id: 'chat-answer',
      name: 'Chat Simple',
      description: 'Conversation basique avec l\'IA',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-blue-500'
    },
    {
      id: 'chat-answer-memory',
      name: 'Chat avec Mémoire',
      description: 'Conversation avec contexte historique',
      icon: <Brain className="w-5 h-5" />,
      color: 'bg-indigo-500'
    },
    {
      id: 'embedding-get-info',
      name: 'Recherche Documentaire',
      description: 'Recherche dans la base de connaissances',
      icon: <FileSearch className="w-5 h-5" />,
      color: 'bg-green-500'
    },
    {
      id: 'embedding-query',
      name: 'Recherche Avancée',
      description: 'Recherche sémantique détaillée',
      icon: <Search className="w-5 h-5" />,
      color: 'bg-teal-500'
    },
    {
      id: 'rag-load-document',
      name: 'RAG Document',
      description: 'Analyse de document avec contexte',
      icon: <Layers className="w-5 h-5" />,
      color: 'bg-orange-500'
    },
    {
      id: 'sentiment-analyze',
      name: 'Analyse Sentiment',
      description: 'Analyse émotionnelle du texte',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'bg-purple-500'
    },
    {
      id: 'image-generate',
      name: 'Génération Image',
      description: 'Création d\'images techniques',
      icon: <ImageIcon className="w-5 h-5" />,
      color: 'bg-pink-500'
    }
  ];

  const testApiConnectivity = async () => {
    try {
      const response = await callAIService('/health');
      const { content, metadata } = formatServiceResponse(response, 'health-check');
      addMessage('system', content, metadata, 'health-check');
    } catch (error) {
      let errorMessage = `❌ Erreur de connexion API: ${error.message}`;
      if (error.message.includes('404')) {
        errorMessage += '\n💡 L\'endpoint /health n\'existe peut-être pas sur votre backend MuleSoft';
      } else if (error.message.includes('CORS')) {
        errorMessage += '\n💡 Problème CORS - vérifiez la configuration du serveur';
      } else if (error.message.includes('Network')) {
        errorMessage += '\n💡 Problème réseau - vérifiez que le serveur est démarré sur http://localhost:8081';
      }
      addMessage('error', errorMessage);
    }
  };

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 transform ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      
      <div className="p-6 border-b border-blue-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Assistant</h2>
              <p className="text-blue-300 text-sm">Bombardier Rail</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-blue-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Services IA</h3>
        <div className="space-y-2">
          {aiServices.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service.id)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                selectedService === service.id
                  ? 'bg-blue-600/30 border border-blue-500/50 text-white'
                  : 'text-gray-300 hover:bg-blue-800/30 hover:text-white'
              }`}
            >
              <div className={`p-2 rounded-lg ${service.color}/20`}>
                {service.icon}
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{service.name}</div>
                <div className="text-xs opacity-75">{service.description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-blue-800/50 pt-4">
          <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide mb-3">Base de Connaissances</h3>
          <select 
            value={currentStore} 
            onChange={(e) => setCurrentStore(e.target.value)}
            className="w-full bg-blue-900/50 border border-blue-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {stores.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>
        </div>

        <div className="border-t border-blue-800/50 pt-4">
          <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide mb-3">Statistiques</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Documents</span>
              <span className="text-white font-medium">{documents.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Messages</span>
              <span className="text-white font-medium">{messages.filter(m => m.type === 'user').length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Statut</span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-green-400 text-xs">En ligne</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ChatInterface = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <h3 className="font-semibold mb-3 text-gray-800 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-blue-600" />
          Actions Rapides
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className={`flex items-center space-x-2 p-3 rounded-xl text-white text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg ${action.color}`}
            >
              {action.icon}
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl flex space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-blue-600' 
                  : message.type === 'error'
                  ? 'bg-red-500'
                  : message.type === 'system'
                  ? 'bg-gray-500'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-white" />
                ) : message.type === 'system' ? (
                  <Info className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              <div className={`rounded-2xl p-4 shadow-sm max-w-full ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-800 border border-gray-200'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                
                {message.metadata && Object.keys(message.metadata).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-opacity-20 border-current">
                    <div className="text-xs opacity-75 space-y-1">
                      {message.service && (
                        <div className="flex items-center space-x-1">
                          <Hash className="w-3 h-3" />
                          <span>Service: {message.service}</span>
                        </div>
                      )}
                      {message.metadata.tokenUsage && (
                        <div className="flex items-center space-x-1">
                          <Cpu className="w-3 h-3" />
                          <span>Tokens: {message.metadata.tokenUsage.totalCount || message.metadata.tokenUsage.inputCount + message.metadata.tokenUsage.outputCount || 'N/A'}</span>
                        </div>
                      )}
                      {message.metadata.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={message.metadata.imageUrl} 
                            alt="Image générée" 
                            className="max-w-xs rounded-lg border"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs opacity-60">{message.timestamp}</span>
                  {message.type === 'assistant' && (
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => navigator.clipboard.writeText(message.content)}
                        className="p-1 rounded hover:bg-black hover:bg-opacity-10"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">L'assistant IA analyse votre demande...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              {aiServices.find(s => s.id === selectedService)?.icon}
              <span>{aiServices.find(s => s.id === selectedService)?.name}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Store: {currentStore}</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Posez votre question (${aiServices.find(s => s.id === selectedService)?.name})...`}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="1"
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={isLoading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
              disabled={isLoading}
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200 hover:scale-105"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileUpload(Array.from(e.target.files))}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        />
      </div>
    </div>
  );

  const DocumentManager = () => (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion Documentaire</h2>
          <p className="text-gray-600">Gérez vos documents et bases de connaissances</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center space-x-2 transition-all duration-200 hover:scale-105"
        >
          <Upload className="w-5 h-5" />
          <span>Charger Documents</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            type: 'embedding-add-document',
            title: 'Documents PDF/Word',
            icon: <FileText className="w-8 h-8" />,
            description: 'PDF, Word, TXT',
            colors: 'border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-500'
          },
          {
            type: 'embedding-add-folder',
            title: 'Dossier Complet',
            icon: <Database className="w-8 h-8" />,
            description: 'Plusieurs fichiers',
            colors: 'border-green-300 hover:border-green-500 hover:bg-green-50 text-green-500'
          },
          {
            type: 'image-read-scanned',
            title: 'Documents Scannés',
            icon: <Camera className="w-8 h-8" />,
            description: 'OCR automatique',
            colors: 'border-orange-300 hover:border-orange-500 hover:bg-orange-50 text-orange-500'
          },
          {
            type: 'image-read',
            title: 'Images Techniques',
            icon: <Image className="w-8 h-8" />,
            description: 'Analyse d\'images',
            colors: 'border-purple-300 hover:border-purple-500 hover:bg-purple-50 text-purple-500'
          }
        ].map((uploadType, idx) => (
          <button
            key={idx}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = uploadType.type.includes('folder');
              input.accept = uploadType.type.includes('image') ? 'image/*' : '.pdf,.doc,.docx,.txt';
              input.onchange = (e) => handleFileUpload(Array.from(e.target.files), uploadType.type);
              input.click();
            }}
            className={`p-6 border-2 border-dashed rounded-xl transition-all duration-200 hover:scale-105 text-center group ${uploadType.colors}`}
          >
            <div className="mb-3 flex justify-center group-hover:scale-110 transition-transform">
              {uploadType.icon}
            </div>
            <h3 className="font-medium text-gray-900 mb-1">{uploadType.title}</h3>
            <p className="text-sm text-gray-500">{uploadType.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Documents Chargés ({documents.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun document chargé</p>
              <p className="text-sm">Utilisez les boutons ci-dessus pour ajouter des documents</p>
            </div>
          ) : (
            documents.map((doc, idx) => (
              <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      doc.success ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <FileText className={`w-5 h-5 ${doc.success ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 truncate max-w-xs">{doc.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{(doc.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{doc.processed.toLocaleString()}</span>
                        <span>•</span>
                        <span className={`${doc.success ? 'text-green-600' : 'text-red-600'}`}>
                          {doc.service}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDocuments(prev => prev.filter((_, i) => i !== idx))}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const AITools = () => (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Outils IA Avancés</h2>
        <p className="text-gray-600">Explorez toutes les capacités de l'intelligence artificielle Bombardier</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200 p-6">
          <h3 className="font-semibold mb-4 flex items-center text-pink-900">
            <ImageIcon className="w-5 h-5 mr-2" />
            Génération d'Images Techniques
          </h3>
          <div className="space-y-3">
            <textarea
              placeholder="Décrivez le schéma technique à générer..."
              className="w-full p-3 border border-pink-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
              rows="3"
              id="imagePrompt"
            />
            <button
              onClick={async () => {
                const prompt = document.getElementById('imagePrompt').value;
                if (!prompt) return;
                
                console.log('🔍 Image Generation Tool - Starting with prompt:', prompt);
                
                try {
                  const response = await callAIService('/ai-chain/image/generate', { prompt });
                  const { content, metadata } = formatServiceResponse(response, 'image-generate');
                  
                  addMessage('assistant', content, metadata, 'image-generate');
                  document.getElementById('imagePrompt').value = '';
                } catch (error) {
                  console.error('❌ Image generation error:', error);
                  addMessage('error', `Erreur lors de la génération d'image: ${error.message}`);
                }
              }}
              className="w-full px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all duration-200 hover:scale-105"
            >
              Générer Schéma Technique
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
          <h3 className="font-semibold mb-4 flex items-center text-green-900">
            <BarChart3 className="w-5 h-5 mr-2" />
            Analyse de Sentiment
          </h3>
          <div className="space-y-3">
            <textarea
              placeholder="Texte à analyser (feedback, rapport, commentaire)..."
              className="w-full p-3 border border-green-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="3"
              id="sentimentText"
            />
            <button
              onClick={async () => {
                const text = document.getElementById('sentimentText').value;
                if (!text) return;
                
                console.log('🔍 Sentiment Analysis Tool - Starting analysis with text:', text);
                
                try {
                  console.log('📞 Calling sentiment analysis API...');
                  const response = await callAIService('/ai-chain/sentiment/analyze', { text });
                  console.log('📥 Sentiment API response received:', response);
                  
                  console.log('🔄 Formatting response...');
                  const { content, metadata } = formatServiceResponse(response, 'sentiment-analyze');
                  console.log('✅ Formatted content:', content);
                  
                  console.log('💬 Adding message to chat...');
                  addMessage('assistant', content, metadata, 'sentiment-analyze');
                  console.log('🧹 Clearing input field...');
                  document.getElementById('sentimentText').value = '';
                  console.log('✅ Sentiment analysis completed successfully');
                  
                } catch (error) {
                  console.error('❌ Sentiment analysis error details:', error);
                  addMessage('error', `Erreur lors de l'analyse de sentiment: ${error.message}`);
                }
              }}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 hover:scale-105"
            >
              Analyser Sentiment
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
          <h3 className="font-semibold mb-4 flex items-center text-purple-900">
            <Search className="w-5 h-5 mr-2" />
            Recherche Sémantique Avancée
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Recherche dans la base de connaissances..."
              className="w-full p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              id="searchQuery"
            />
            <button
              onClick={async () => {
                const query = document.getElementById('searchQuery').value;
                if (!query) return;
                
                try {
                  const response = await callAIService('/ai-chain/embedding/query', { 
                    question: query,
                    store: currentStore,
                    maxResults: 5,
                    minScore: 0.7
                  });
                  
                  const { content, metadata } = formatServiceResponse(response, 'embedding-query');
                  
                  addMessage('assistant', content, metadata, 'embedding-query');
                  document.getElementById('searchQuery').value = '';
                } catch (error) {
                  addMessage('error', `Erreur lors de la recherche: ${error.message}`);
                }
              }}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105"
            >
              Rechercher dans les Documents
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
          <h3 className="font-semibold mb-4 flex items-center text-yellow-900">
            <Database className="w-5 h-5 mr-2" />
            Gestion des Bases de Connaissances
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nom de la nouvelle base..."
              className="w-full p-3 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              id="newStoreName"
            />
            <button
              onClick={async () => {
                const storeName = document.getElementById('newStoreName').value;
                if (!storeName) return;
                
                try {
                  const response = await callAIService('/ai-chain/embedding/new-store', { storeName });
                  const { content, metadata } = formatServiceResponse(response, 'embedding-new-store');
                  
                  if (response.success) {
                    setStores(prev => [...prev, storeName]);
                  }
                  
                  addMessage('assistant', content, metadata, 'embedding-new-store');
                  document.getElementById('newStoreName').value = '';
                } catch (error) {
                  addMessage('error', `Erreur lors de la création de la base: ${error.message}`);
                }
              }}
              className="w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 hover:scale-105"
            >
              Créer Nouvelle Base
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4 flex items-center text-gray-900">
          <Settings className="w-5 h-5 mr-2" />
          Test de Connectivité API
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Testez la connectivité avec le backend MuleSoft</p>
          <button
            onClick={testApiConnectivity}
            className="w-full px-4 py-2 bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-lg hover:from-gray-700 hover:to-slate-700 transition-all duration-200 hover:scale-105"
          >
            Tester la Connexion
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assistant IA Bombardier</h1>
                <p className="text-gray-600">Support technique et maintenance ferroviaire</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-green-600 font-medium">En ligne</span>
              </div>
              
              <button 
                onClick={testApiConnectivity}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <nav className="bg-white border-b border-gray-200">
          <div className="px-6">
            <div className="flex space-x-8">
              {[
                { id: 'chat', name: 'Chat IA', icon: MessageCircle },
                { id: 'documents', name: 'Documents', icon: FileText },
                { id: 'tools', name: 'Outils IA', icon: Zap }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-hidden">
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'documents' && <DocumentManager />}
          {activeTab === 'tools' && <AITools />}
        </main>
      </div>
    </div>
  );
};

export default BombardierAIAssistant;