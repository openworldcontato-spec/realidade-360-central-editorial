# Visual Intelligence v2

Ajustes aplicados:

- Pautas com pessoas públicas agora priorizam composição editorial fotorealista com os protagonistas identificados pela IA.
- A arte continua marcada como ilustrativa/editorial e não deve ser tratada como registro documental do fato.
- O Pacote Completo envia títulos das fontes para ajudar a identificar corretamente os protagonistas.
- O contador de Fontes na Revisão Final usa fallback de `sources_text` e Checagem 360 quando `StorySource` ainda não estiver disponível, evitando `Fontes (0)` incorreto.

Observação: este patch usa os nomes/contexto da pauta para orientar o gerador. Ele não baixa nem transforma automaticamente a fotografia original de um veículo; isso exigiria uma integração específica de ingestão/licenciamento de imagens.
