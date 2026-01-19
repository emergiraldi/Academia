const fs = require('fs');

const arquivo = 'C:/Projeto/Academia/server/routers.ts';
let conteudo = fs.readFileSync(arquivo, 'utf8');

// Adicionar código para deletar foto antiga antes de enviar nova (Professores)
const antigoProfessor = `            // Upload face image
            const imageBuffer = Buffer.from(
              input.faceImageBase64.replace(/^data:image\\/\\w+;base64,/, ''),
              'base64'
            );

            let result;
            try {
              result = await controlIdService.uploadFaceImage(controlIdUserId, imageBuffer);
            } catch (uploadError: any) {
              if (uploadError.message && uploadError.message.includes('User does not exist')) {
                console.log('[uploadFaceImage-Professor] ⚠️  Usuário não existe, recriando...');`;

const novoProfessor = `            // Upload face image
            const imageBuffer = Buffer.from(
              input.faceImageBase64.replace(/^data:image\\/\\w+;base64,/, ''),
              'base64'
            );

            // Se já tinha facial cadastrada, deletar primeiro para recadastrar
            if (professor.faceEnrolled && controlIdUserId) {
              try {
                console.log('[uploadFaceImage-Professor] 🗑️  Deletando foto facial antiga...');
                await controlIdService.deleteFaceImages(controlIdUserId);
                console.log('[uploadFaceImage-Professor] ✅ Foto antiga deletada');
              } catch (deleteError) {
                console.log('[uploadFaceImage-Professor] ⚠️  Erro ao deletar foto antiga (continuando):', deleteError);
              }
            }

            let result;
            try {
              result = await controlIdService.uploadFaceImage(controlIdUserId, imageBuffer);
            } catch (uploadError: any) {
              if (uploadError.message && uploadError.message.includes('User does not exist')) {
                console.log('[uploadFaceImage-Professor] ⚠️  Usuário não existe, recriando...');`;

conteudo = conteudo.replace(antigoProfessor, novoProfessor);

// Adicionar código para deletar foto antiga antes de enviar nova (Staff)
const antigoStaff = `            // Upload face image
            const imageBuffer = Buffer.from(
              input.faceImageBase64.replace(/^data:image\\/\\w+;base64,/, ''),
              'base64'
            );

            let result;
            try {
              result = await controlIdService.uploadFaceImage(controlIdUserId, imageBuffer);
            } catch (uploadError: any) {
              if (uploadError.message && uploadError.message.includes('User does not exist')) {
                console.log('[uploadFaceImage-Staff] ⚠️  Usuário não existe, recriando...');`;

const novoStaff = `            // Upload face image
            const imageBuffer = Buffer.from(
              input.faceImageBase64.replace(/^data:image\\/\\w+;base64,/, ''),
              'base64'
            );

            // Se já tinha facial cadastrada, deletar primeiro para recadastrar
            if (staffMember.faceEnrolled && controlIdUserId) {
              try {
                console.log('[uploadFaceImage-Staff] 🗑️  Deletando foto facial antiga...');
                await controlIdService.deleteFaceImages(controlIdUserId);
                console.log('[uploadFaceImage-Staff] ✅ Foto antiga deletada');
              } catch (deleteError) {
                console.log('[uploadFaceImage-Staff] ⚠️  Erro ao deletar foto antiga (continuando):', deleteError);
              }
            }

            let result;
            try {
              result = await controlIdService.uploadFaceImage(controlIdUserId, imageBuffer);
            } catch (uploadError: any) {
              if (uploadError.message && uploadError.message.includes('User does not exist')) {
                console.log('[uploadFaceImage-Staff] ⚠️  Usuário não existe, recriando...');`;

conteudo = conteudo.replace(antigoStaff, novoStaff);

fs.writeFileSync(arquivo, conteudo, 'utf8');

console.log('✅ Funcionalidade de recadastrar facial adicionada!');
console.log('📝 Agora quando clicar em "Recadastrar Facial":');
console.log('  1. Deleta a foto antiga do Control ID');
console.log('  2. Envia a nova foto');
console.log('  3. Mantém o mesmo usuário no Control ID');
