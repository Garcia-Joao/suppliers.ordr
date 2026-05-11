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

## Rotas iniciais

- `/login`
- `/`
- `/pedidos`
- `/tabelas`
- `/produtos`
- `/perfil`

## Rotas de API esperadas futuramente

- `POST /supplier-portal/auth/login`
- `GET /supplier-portal/dashboard`
- `GET /supplier-portal/orders`
- `GET /supplier-portal/price-tables`
- `GET /supplier-portal/products`
- `GET /supplier-portal/profile`

As telas já têm fallback visual para desenvolvimento mesmo antes dessas rotas existirem.
