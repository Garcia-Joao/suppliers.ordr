# ORDR Suppliers

Portal externo para fornecedores do ORDR.

## Criar projeto manualmente

```bash
npx create-next-app@latest suppliers.ordr --ts --app --no-src-dir --tailwind --eslint --import-alias "@/*"
cd suppliers.ordr
npm install lucide-react framer-motion clsx tailwind-merge recharts date-fns @vercel/analytics tw-animate-css
```

Depois substitua/adicone os arquivos deste pacote.

## Rodar localmente

```bash
cp .env.example .env.local
npm run dev
```

O projeto roda em `http://localhost:3002`.

## Tema

- ORDR App: laranja
- Terminal: azul
- Suppliers: verde/esmeralda

O portal de fornecedores tem dois temas:

- escuro como padrão
- claro via botão no menu

O ícone usa o mesmo símbolo do ORDR/Terminal, mudando apenas a cor para verde/esmeralda.

## Login

O Suppliers usa o mesmo login do ORDR (`/auth/login`). O usuário só entra no portal se a empresa atual for do tipo `SUPPLIER`.

## Rotas iniciais

- `/login`
- `/`
- `/pedidos`
- `/tabelas`
- `/produtos`
- `/perfil`
