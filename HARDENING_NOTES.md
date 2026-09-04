# Realidade 360 — Hardening local

Revisão aplicada sobre o ZIP exportado do Base44.

## Ajustes adicionais

- URL de deduplicação preserva maiúsculas/minúsculas de path/query e remove apenas parâmetros claramente de tracking.
- `ref` e `si` deixaram de ser removidos globalmente para evitar colisões entre conteúdos legítimos.
- Velocity Score não atribui aceleração sem snapshot anterior e não pontua redescoberta sem fonte nova.
- Uma única fonte nova recebe sinal de velocidade pequeno; aceleração forte exige crescimento real.
- `updateApuracao` deduplica também a contagem de fontes primárias.
- UI do Pacote Completo usa “suporte documental”, evitando sugerir probabilidade de verdade.

## Já confirmado no ZIP recebido

- `/register` redireciona para `/login`.
- Login não oferece cadastro público nem Google OAuth.
- Radar deduplica fontes antes do Opportunity Score.
- Pacote Completo tenta compor e enviar PNG final 1080×1350, preservando a imagem-base em caso de falha.
- Artwork possui `composed_url` e versionamento por `parent_id`.
- Checagem 360 informa explicitamente que é auditoria assistida por IA.

## Validação

A instalação de dependências não pôde ser concluída neste ambiente (rede/timeout), portanto o build Vite não foi certificado aqui. As mudanças foram mantidas pequenas e compatíveis com a sintaxe existente.
