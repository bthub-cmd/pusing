#!/bin/bash

echo "========================================="
echo "  WhatsApp Bot Advanced - Installation"
echo "========================================="
echo ""

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Node.js tidak terinstall!"
    echo "Install Node.js 18+ terlebih dahulu: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js detected: $NODE_VERSION"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Installation failed!"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Create .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created!"
else
    echo "⚠️  .env file already exists, skipping..."
fi

echo ""

# Create logs directory
if [ ! -d logs ]; then
    echo "📁 Creating logs directory..."
    mkdir logs
    echo "✅ Logs directory created!"
fi

echo ""

# Install PM2 globally (optional)
echo "🔧 Installing PM2 (process manager)..."
npm install -g pm2

if [ $? -ne 0 ]; then
    echo "⚠️  PM2 installation failed (maybe need sudo)"
    echo "Run: sudo npm install -g pm2"
else
    echo "✅ PM2 installed successfully!"
fi

echo ""
echo "========================================="
echo "  ✅ INSTALLATION COMPLETE!"
echo "========================================="
echo ""
echo "📌 Next Steps:"
echo ""
echo "1. Start the bot:"
echo "   npm start"
echo ""
echo "   OR with PM2 (recommended for VPS):"
echo "   npm run pm2"
echo ""
echo "2. Scan QR code with WhatsApp"
echo ""
echo "3. Find owner registration code in terminal"
echo ""
echo "4. Register as owner:"
echo "   Send: .code <16-digit-code>"
echo ""
echo "5. Set downloader API (owner only):"
echo "   .apidownload https://your-api-url.com"
echo ""
echo "6. Check commands:"
echo "   .menu"
echo ""
echo "========================================="
echo "  Happy using WhatsApp Bot! 🎉"
echo "========================================="
