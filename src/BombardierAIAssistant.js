import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Upload, 
  FileText, 
  Image, 
  Brain, 
  Search, 
  Zap, 
  Database,
  Camera,
  BarChart3,
  Settings,
  Send,
  Paperclip,
  Download,
  Eye,
  Trash2
} from 'lucide-react';

const API_BASE = 'http://localhost:8081/api/v1';

const BombardierAIAssistant = () => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'system', content: 'Bienvenue dans l\'Assistant IA de Maintenance Bombardier. Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [documents, setDocuments] = useState([]);
  const [embeddings, setEmbeddings] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [chatMemory, setChatMemory] = useState(true);
  const [currentStore, setCurrentStore] = useState('default');
  const [stores, setStores] = useState(['default', 'hydraulic-systems', 'brake-systems', 'legacy-trains']);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type, content, metadata = null) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date().toLocaleTimeString(),
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const callAIService = async (endpoint, data = {}) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      addMessage('error', `Erreur API: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = addMessage('user', input);
    const userInput = input;
    setInput('');
    
    try {
      let response;
      
      if (chatMemory) {
        // Chat avec mémoire
        const conversationHistory = messages.filter(m => m.type === 'user' || m.type === 'assistant')
          .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));
        
        response = await callAIService('/ai-chain/chat/answer-with-memory', {
          message: userInput,
          history: conversationHistory,
          store: currentStore
        });
      } else {
        // Chat simple
        response = await callAIService('/ai-chain/chat/answer', {
          message: userInput,
          store: currentStore
        });
      }
      
      addMessage('assistant', response.answer, response.sources);
    } catch (error) {
      addMessage('error', 'Désolé, une erreur est survenue lors du traitement de votre message.');
    }
  };

  const handleFileUpload = async (files, type = 'document') => {
    const formData = new FormData();
    
    for (let file of files) {
      formData.append('files', file);
    }
    formData.append('store', currentStore);
    formData.append('type', type);
    
    try {
      setIsLoading(true);
      let endpoint;
      
      switch (type) {
        case 'folder':
          endpoint = '/ai-chain/embedding/add-folder';
          break;
        case 'scanned':
          endpoint = '/ai-chain/image/read-scanned';
          break;
        case 'image':
          endpoint = '/ai-chain/image/read';
          break;
        case 'rag':
          endpoint = '/ai-chain/rag/load-document';
          break;
        default:
          endpoint = '/ai-chain/embedding/add-document';
      }
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        addMessage('system', `✅ ${files.length} document(s) traité(s) avec succès`);
        setDocuments(prev => [...prev, ...result.documents || []]);
        
        if (type === 'scanned' || type === 'image') {
          addMessage('assistant', `Contenu extrait: ${result.extractedText}`, result);
        }
      } else {
        addMessage('error', `Erreur lors du traitement: ${result.error}`);
      }
    } catch (error) {
      addMessage('error', `Erreur lors de l'upload: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmbeddingQuery = async (query, type = 'get-info') => {
    try {
      const endpoint = type === 'query' ? '/ai-chain/embedding/query' : '/ai-chain/embedding/get-info';
      const response = await callAIService(endpoint, {
        query,
        store: currentStore
      });
      
      addMessage('assistant', response.answer, response.sources);
    } catch (error) {
      addMessage('error', 'Erreur lors de la recherche dans les documents.');
    }
  };

  const generateImage = async (description) => {
    try {
      const response = await callAIService('/ai-chain/image/generate', {
        prompt: description,
        style: 'technical_diagram'
      });
      
      addMessage('assistant', 'Schéma généré:', { 
        type: 'image', 
        url: response.imageUrl,
        description: description
      });
    } catch (error) {
      addMessage('error', 'Erreur lors de la génération d\'image.');
    }
  };

  const analyzeSentiment = async (text) => {
    try {
      const response = await callAIService('/ai-chain/sentiment/analyze', {
        text
      });
      
      addMessage('assistant', `Analyse de sentiment: ${response.sentiment} (Score: ${response.score})`, response);
    } catch (error) {
      addMessage('error', 'Erreur lors de l\'analyse de sentiment.');
    }
  };

  const createNewStore = async (storeName) => {
    try {
      await callAIService('/ai-chain/embedding/new-store', {
        storeName
      });
      
      setStores(prev => [...prev, storeName]);
      addMessage('system', `✅ Nouvelle base documentaire "${storeName}" créée`);
    } catch (error) {
      addMessage('error', 'Erreur lors de la création de la base documentaire.');
    }
  };

  const QuickActions = () => (
    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold mb-2 text-blue-900">Actions Rapides</h3>
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setInput('Quelle est la procédure de vérification des freins ?')}
          className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
        >
          🚆 Procédure freinage
        </button>
        <button 
          onClick={() => setInput('Génère un schéma du système hydraulique')}
          className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
        >
          📊 Schéma hydraulique
        </button>
        <button 
          onClick={() => handleEmbeddingQuery('anomalies circuit hydraulique', 'query')}
          className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm hover:bg-orange-200"
        >
          🔍 Recherche anomalies
        </button>
        <button 
          onClick={() => analyzeSentiment('Les techniciens sont satisfaits de la nouvelle procédure')}
          className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm hover:bg-purple-200"
        >
          😊 Analyse sentiment
        </button>
      </div>
    </div>
  );

  const ChatInterface = () => (
    <div className="flex flex-col h-full">
      <QuickActions />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '60vh' }}>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl p-3 rounded-lg ${
              message.type === 'user' 
                ? 'bg-blue-600 text-white' 
                : message.type === 'error'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : message.type === 'system'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-gray-200 text-gray-800'
            }`}>
              <div className="text-sm">{message.content}</div>
              {message.metadata && (
                <div className="mt-2 text-xs opacity-75">
                  {message.metadata.type === 'image' && (
                    <img src={message.metadata.url} alt={message.metadata.description} className="mt-2 max-w-full rounded" />
                  )}
                  {message.metadata.sources && (
                    <div>Sources: {message.metadata.sources.join(', ')}</div>
                  )}
                </div>
              )}
              {message.timestamp && (
                <div className="text-xs mt-1 opacity-50">{message.timestamp}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex items-center mb-2">
          <label className="flex items-center text-sm text-gray-600 mr-4">
            <input 
              type="checkbox" 
              checked={chatMemory} 
              onChange={(e) => setChatMemory(e.target.checked)}
              className="mr-2"
            />
            Mémoire de conversation
          </label>
          <select 
            value={currentStore} 
            onChange={(e) => setCurrentStore(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            {stores.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Posez votre question..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            disabled={isLoading}
          >
            <Paperclip size={20} />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
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
  );

  const DocumentManager = () => (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestion Documentaire</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <Upload size={16} />
          <span>Charger des documents</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          data-type="document"
          className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 text-center"
        >
          <FileText className="mx-auto mb-2 text-blue-500" size={32} />
          <span className="text-sm">Documents PDF/Word</span>
        </button>
        
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.pdf,.doc,.docx,.txt';
            input.onchange = (e) => handleFileUpload(Array.from(e.target.files), 'folder');
            input.click();
          }}
          className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 text-center"
        >
          <Database className="mx-auto mb-2 text-green-500" size={32} />
          <span className="text-sm">Dossier complet</span>
        </button>
        
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            input.onchange = (e) => handleFileUpload(Array.from(e.target.files), 'scanned');
            input.click();
          }}
          className="p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 text-center"
        >
          <Camera className="mx-auto mb-2 text-orange-500" size={32} />
          <span className="text-sm">Documents scannés</span>
        </button>
        
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.doc,.docx';
            input.onchange = (e) => handleFileUpload(Array.from(e.target.files), 'rag');
            input.click();
          }}
          className="p-4 border-2 border-dashed border-red-300 rounded-lg hover:border-red-500 text-center"
        >
          <Zap className="mx-auto mb-2 text-red-500" size={32} />
          <span className="text-sm">Document urgent (RAG)</span>
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Documents chargés ({documents.length})</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {documents.map((doc, idx) => (
            <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border">
              <span className="text-sm truncate">{doc.name}</span>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Eye size={16} />
                </button>
                <button className="text-red-600 hover:text-red-800">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AITools = () => (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-semibold">Outils IA Spécialisés</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center">
            <Image className="mr-2" size={20} />
            Génération d'images
          </h3>
          <input
            type="text"
            placeholder="Décrivez le schéma à générer..."
            className="w-full p-2 border rounded mb-2"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                generateImage(e.target.value);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder*="schéma"]');
              generateImage(input.value);
              input.value = '';
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Générer schéma technique
          </button>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Analyse de sentiment
          </h3>
          <textarea
            placeholder="Texte à analyser..."
            className="w-full p-2 border rounded mb-2 h-20 resize-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                analyzeSentiment(e.target.value);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const textarea = document.querySelector('textarea[placeholder*="analyser"]');
              analyzeSentiment(textarea.value);
              textarea.value = '';
            }}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Analyser sentiment
          </button>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center">
            <Search className="mr-2" size={20} />
            Recherche avancée
          </h3>
          <input
            type="text"
            placeholder="Requête de recherche..."
            className="w-full p-2 border rounded mb-2"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleEmbeddingQuery(e.target.value, 'query');
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder*="Requête"]');
              handleEmbeddingQuery(input.value, 'query');
              input.value = '';
            }}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Rechercher dans les documents
          </button>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center">
            <Database className="mr-2" size={20} />
            Nouvelle base documentaire
          </h3>
          <input
            type="text"
            placeholder="Nom de la nouvelle base..."
            className="w-full p-2 border rounded mb-2"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                createNewStore(e.target.value);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder*="nouvelle base"]');
              createNewStore(input.value);
              input.value = '';
            }}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Créer nouvelle base
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden" style={{ height: '90vh' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain size={32} />
            <div>
              <h1 className="text-xl font-bold">Assistant IA Maintenance</h1>
              <p className="text-blue-100 text-sm">Bombardier Technical Support</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Base: {currentStore}</span>
            <Settings size={20} className="cursor-pointer hover:text-blue-200" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-100 border-b">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 font-medium ${activeTab === 'chat' 
              ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-600 hover:text-gray-800'}`}
          >
            <MessageCircle className="inline mr-2" size={16} />
            Chat IA
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-6 py-3 font-medium ${activeTab === 'documents' 
              ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-600 hover:text-gray-800'}`}
          >
            <FileText className="inline mr-2" size={16} />
            Documents
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-6 py-3 font-medium ${activeTab === 'tools' 
              ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-600 hover:text-gray-800'}`}
          >
            <Zap className="inline mr-2" size={16} />
            Outils IA
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1" style={{ height: 'calc(90vh - 140px)' }}>
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'documents' && <DocumentManager />}
        {activeTab === 'tools' && <AITools />}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-600 border-t">
        <div className="flex justify-between items-center">
          <span>Connecté à MuleSoft AI Chain • {documents.length} documents chargés</span>
          <span className={`flex items-center ${isLoading ? 'text-orange-600' : 'text-green-600'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isLoading ? 'bg-orange-400' : 'bg-green-400'}`}></span>
            {isLoading ? 'Traitement...' : 'Prêt'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BombardierAIAssistant;