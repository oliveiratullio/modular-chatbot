# 🧪 Como Testar o Sistema de Histórico

## ✅ Problema Resolvido

O problema de "ao dar refresh na página, as perguntas anteriores não foram salvas" foi corrigido com as seguintes implementações:

### 🔧 **Mudanças Implementadas**

1. **Hook `useUserId`**:
   - Gera e persiste um userId único no localStorage
   - Garante consistência entre sessões

2. **Hook `useHistory`**:
   - Carrega automaticamente o histórico quando o componente é montado
   - Recarrega o histórico após cada mensagem enviada
   - Gerencia estados de loading e erro

3. **Integração no ChatLayout**:
   - Usa userId consistente em todas as conversas
   - Inicializa conversas com o userId correto

4. **Integração no ChatArea**:
   - Recarrega histórico automaticamente após enviar mensagem
   - Usa o hook de histórico para gerenciar estado

5. **Atualização do HistoryPanel**:
   - Usa o hook de histórico para simplificar código
   - Recarrega dados quando o painel é aberto

## 🚀 **Como Testar**

### **Teste 1: Persistência após Refresh**

1. Abra o chatbot
2. Faça algumas perguntas (ex: "Qual a taxa da maquininha?", "Quanto é 2+2?")
3. Dê refresh na página (F5)
4. Clique no botão "Histórico" no header da conversa
5. ✅ **Resultado esperado**: As perguntas anteriores devem aparecer na lista

### **Teste 2: Reutilização de Perguntas**

1. Abra o painel de histórico
2. Clique em uma pergunta anterior
3. ✅ **Resultado esperado**: A pergunta deve ser enviada automaticamente

### **Teste 3: Remoção de Perguntas**

1. No painel de histórico, clique no ícone 🗑️ de uma pergunta
2. ✅ **Resultado esperado**: A pergunta deve ser removida da lista

### **Teste 4: Limpeza do Histórico**

1. No painel de histórico, clique no botão 🗑️ do header
2. Confirme a ação
3. ✅ **Resultado esperado**: Todas as perguntas devem ser removidas

### **Teste 5: Múltiplas Sessões**

1. Faça algumas perguntas
2. Feche o navegador completamente
3. Reabra o navegador e acesse o chatbot
4. Abra o histórico
5. ✅ **Resultado esperado**: As perguntas devem estar lá

## 🔍 **Verificação Técnica**

### **Backend (Redis)**

- As perguntas são salvas com chave: `history:question:{id}`
- Lista do usuário: `history:user:{userId}`
- Expiração: 30 dias

### **Frontend (localStorage)**

- userId é salvo em: `chatbot_user_id`
- Persiste entre sessões do navegador

### **Endpoints da API**

- `GET /history/:userId` - Lista perguntas
- `DELETE /history/:userId/question/:questionId` - Remove pergunta
- `DELETE /history/:userId` - Limpa histórico

## 🐛 **Se algo não funcionar**

1. **Verifique o Redis**:

   ```bash
   docker-compose up redis
   ```

2. **Verifique os logs do backend**:

   ```bash
   docker-compose logs backend
   ```

3. **Verifique o localStorage**:
   - Abra DevTools (F12)
   - Vá em Application > Local Storage
   - Verifique se existe `chatbot_user_id`

4. **Verifique a rede**:
   - Abra DevTools (F12)
   - Vá em Network
   - Verifique se as chamadas para `/history/:userId` estão funcionando

## 📝 **Notas Importantes**

- O sistema funciona mesmo sem Redis (modo degradado)
- O userId é gerado automaticamente na primeira visita
- O histórico é recarregado automaticamente após cada mensagem
- As perguntas expiram em 30 dias no Redis
