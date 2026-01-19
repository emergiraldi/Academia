const fs = require('fs');

const arquivo = 'C:/Projeto/Academia/server/routers.ts';
let conteudo = fs.readFileSync(arquivo, 'utf8');

// Adicionar logs detalhados antes do upload (Professores)
const antigoProfLog = `            // Upload face image
            const imageBuffer = Buffer.from(
              input.faceImageBase64.replace(/^data:image\/\w+;base64,/, ''),
              'base64'
            );

            let result;
            try {
              result = await controlIdService.uploadFaceImage(controlIdUserId, imageBuffer);
            } catch (uploadError: any) {
              if (uploadError.message && uploadError.message.includes('User does not exist')) {
                console.log('[uploadFaceImage-Professor] ⚠️  Usuário não existe, recriando...');`;

const novoProfLog = `            // Upload face image
            const imageBuffer = Buffer.from(
              input.faceImageBase64.replace(/^data:image\/\w+;base64,/, ''),
              'base64'
            );

            console.log('[uploadFaceImage-Professor] 📸 Preparando upload...');
            console.log('[uploadFaceImage-Professor]    controlIdUserId:', controlIdUserId);
            console.log('[uploadFaceImage-Professor]    imageBuffer size:', (imageBuffer.length / 1024).toFixed(2), 'KB');
            console.log('[uploadFaceImage-Professor]    professor.userName:', professor.userName);
            console.log('[uploadFaceImage-Professor]    professor.accessStatus:', professor.accessStatus);

            let result;
            try {
              console.log('[uploadFaceImage-Professor] 🚀 Chamando Control ID uploadFaceImage...');
              result = await controlIdService.uploadFaceImage(controlIdUserId, imageBuffer);
              console.log('[uploadFaceImage-Professor] ✅ Resultado:', JSON.stringify(result, null, 2));
            } catch (uploadError: any) {
              console.log('[uploadFaceImage-Professor] ❌ Erro no upload:', uploadError);
              console.log('[uploadFaceImage-Professor] ❌ Erro message:', uploadError.message);
              console.log('[uploadFaceImage-Professor] ❌ Erro response:', uploadError.response?.data);
              if (uploadError.message && uploadError.message.includes('User does not exist')) {
                console.log('[uploadFaceImage-Professor] ⚠️  Usuário não existe, recriando...');`;

conteudo = conteudo.replace(antigoProfLog, novoProfLog);

fs.writeFileSync(arquivo, conteudo, 'utf8');

console.log('✅ Logs adicionados!');
console.log('📝 Agora o sistema vai mostrar:');
console.log('  - Tamanho da imagem');
console.log('  - ID do usuário no Control ID');
console.log('  - Nome e status do professor');
console.log('  - Detalhes completos de qualquer erro');
