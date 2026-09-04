# Realidade 360 — Visual Intelligence v2.1

Ajustes desta versão:

- Motor visual limita pautas com pessoas a no máximo 2 protagonistas e exige exatamente essa quantidade de retratos, evitando rostos duplicados/terceiros aleatórios.
- Prompt reforçado para gerar somente a base fotográfica: zero texto, letras, logos, placas ou pseudo-tipografia.
- Composição `Destaque` redesenhada: protagonistas no topo, gradiente/painel opaco cobrindo a parte inferior da imagem-base, selo de editoria e headline renderizados pelo canvas do app.
- Headline recebe redução automática de fonte conforme o número de palavras, reduzindo cortes.
- Data do Radar agora possui parser defensivo para registros ISO e para dados legados em `DD/MM/YYYY HH:mm:ss`, evitando inversão 04/09 ↔ 09/04.

Observação editorial: as imagens com pessoas continuam marcadas internamente como ilustrativas/editoriais; não representam fotografia documental de um encontro/evento específico.
