import { NextRequest, NextResponse } from "next/server";

// This simulates a PayWay payment gateway that shows a QR code
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const returnTo = url.searchParams.get("return");

  if (!returnTo) {
    return NextResponse.json(
      { error: "Missing return callback" },
      { status: 400 }
    );
  }

  // Parse the callback URL to get payment details
  const callback = new URL(returnTo);
  const userId = callback.searchParams.get("user");
  const campaignId = callback.searchParams.get("campaign");
  const amount = callback.searchParams.get("amount");
  const method = callback.searchParams.get("method");
  const comment = callback.searchParams.get("comment");

  // Create a QR code payment page
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PayWay Payment - ABA KHQR</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .payment-container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
                width: 100%;
            }
            .logo {
                width: 80px;
                height: 80px;
                background: #1a5f7a;
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
            }
            .amount {
                font-size: 36px;
                font-weight: bold;
                color: #1a5f7a;
                margin: 20px 0;
            }
            .qr-code {
                width: 200px;
                height: 200px;
                background: #f0f0f0;
                border-radius: 15px;
                margin: 30px auto;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px dashed #ccc;
                position: relative;
            }
            .qr-code::before {
                content: "📱";
                font-size: 60px;
            }
            .qr-code::after {
                content: "Scan with ABA Mobile App";
                position: absolute;
                bottom: -30px;
                font-size: 12px;
                color: #666;
                white-space: nowrap;
            }
            .payment-info {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                text-align: left;
            }
            .payment-info div {
                margin: 8px 0;
                display: flex;
                justify-content: space-between;
            }
            .payment-info .label {
                color: #666;
                font-weight: 500;
            }
            .payment-info .value {
                color: #333;
                font-weight: 600;
            }
            .success-message {
                display: none;
                background: #d4edda;
                color: #155724;
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                border: 1px solid #c3e6cb;
            }
            .btn {
                background: #1a5f7a;
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin: 10px;
                transition: background 0.3s;
            }
            .btn:hover {
                background: #134b5f;
            }
            .btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .btn.success {
                background: #28a745;
            }
            .btn.success:hover {
                background: #218838;
            }
            .status {
                margin: 20px 0;
                padding: 10px;
                border-radius: 8px;
                font-weight: 500;
            }
            .status.pending {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            .status.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
        </style>
    </head>
    <body>
        <div class="payment-container">
            <div class="logo">ABA</div>
            <h1>Payment Request</h1>
            
            <div class="amount">$${amount}</div>
            
            <div class="qr-code" id="qrCode">
                <!-- QR code will be generated here -->
            </div>
            
            <div class="payment-info">
                <div>
                    <span class="label">Amount:</span>
                    <span class="value">$${amount} USD</span>
                </div>
                <div>
                    <span class="label">Method:</span>
                    <span class="value">${method?.toUpperCase()}</span>
                </div>
                <div>
                    <span class="label">Campaign:</span>
                    <span class="value">${campaignId}</span>
                </div>
                ${
                  comment
                    ? `<div>
                    <span class="label">Comment:</span>
                    <span class="value">${comment}</span>
                </div>`
                    : ""
                }
            </div>
            
            <div class="status pending" id="status">
                ⏳ Waiting for payment...
            </div>
            
            <div class="success-message" id="successMessage">
                ✅ Payment successful! Redirecting you back...
            </div>
            
            <button class="btn" id="payButton" onclick="simulatePayment()">
                💳 Simulate Payment (Dev)
            </button>
            
            <button class="btn" onclick="window.history.back()">
                ← Cancel
            </button>
        </div>

        <script>
            let paymentProcessed = false;
            
            function simulatePayment() {
                if (paymentProcessed) return;
                
                paymentProcessed = true;
                const status = document.getElementById('status');
                const successMessage = document.getElementById('successMessage');
                const payButton = document.getElementById('payButton');
                const qrCode = document.getElementById('qrCode');
                
                // Update UI
                status.className = 'status success';
                status.innerHTML = '✅ Payment confirmed!';
                successMessage.style.display = 'block';
                payButton.disabled = true;
                payButton.className = 'btn success';
                payButton.innerHTML = '✅ Paid';
                qrCode.style.background = '#d4edda';
                qrCode.style.borderColor = '#28a745';
                
                // Simulate processing delay
                setTimeout(() => {
                    // Redirect to callback with success status
                    const callbackUrl = '${returnTo}&status=200';
                    window.location.href = callbackUrl;
                }, 2000);
            }
            
            // Auto-simulate payment after 10 seconds for demo
            setTimeout(() => {
                if (!paymentProcessed) {
                    simulatePayment();
                }
            }, 10000);
        </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
