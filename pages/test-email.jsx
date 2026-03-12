import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Paper } from '@mui/material';

export default function TestEmail() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestEmail = async () => {
    if (!email) {
      alert('請輸入測試郵箱地址');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEmail: email }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: 'Network error',
        details: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          🧪 郵件功能測試
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          這個頁面用於測試 NFT 領取確認郵件的發送功能。
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="測試郵箱地址"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@gmail.com"
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={handleTestEmail}
            disabled={loading || !email}
            size="large"
          >
            {loading ? "發送中..." : "發送測試郵件"}
          </Button>
        </Box>

        {result && (
          <Paper
            sx={{
              p: 3,
              backgroundColor: result.success ? "#e8f5e8" : "#ffeaea",
              border: `1px solid ${result.success ? "#4caf50" : "#f44336"}`,
            }}
          >
            <Typography
              variant="h6"
              color={result.success ? "success.main" : "error.main"}
              gutterBottom
            >
              {result.success ? "✅ 測試成功" : "❌ 測試失敗"}
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
              {result.success ? result.message : result.error}
            </Typography>

            {result.details && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>詳細信息：</strong> {result.details}
              </Typography>
            )}

            {result.messageId && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>郵件 ID：</strong> {result.messageId}
              </Typography>
            )}

            {result.config && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  當前配置：
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    fontSize: "0.8rem",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(result.config, null, 2)}
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        <Box sx={{ mt: 4, p: 2, backgroundColor: "#f0f8ff", borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            📝 使用說明：
          </Typography>
          <Typography variant="body2" component="div">
            1. 確保在 <code>.env.local</code> 中設置了正確的 SMTP 配置
            <br />
            2. 輸入你的郵箱地址
            <br />
            3. 點擊「發送測試郵件」
            <br />
            4. 檢查你的郵箱是否收到測試郵件
          </Typography>
        </Box>
      </Paper>

      {/* Email Content Sample for SendGrid Review */}
      <Paper
        variant="outlined"
        sx={{ mt: 4, overflow: 'hidden', borderRadius: 0 }}
      >
        <Box sx={{
          p: 2,
          borderBottom: '1px solid #2483ff33',
        }}>
          <Typography
            variant="overline"
            sx={{ letterSpacing: '0.2em' }}
          >
            Email Content Sample — SendGrid Review
          </Typography>
        </Box>

        {/* Email Preview */}
        <Box sx={{ backgroundColor: '#f5f5f5', p: 3 }}>
          <Box sx={{
            maxWidth: 600,
            mx: 'auto',
            border: '1px solid #2483ff33',
            borderRadius: 0,
            overflow: 'hidden',
            backgroundColor: '#fff',
          }}>
            {/* Email Header */}
            <Box sx={{
              borderBottom: '1px solid #2483ff33',
              p: 4,
              textAlign: 'center',
            }}>
              <Typography
                variant="h3"
                sx={{
                  color: '#2483ff',
                  fontWeight: 400,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                KAIROS
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#999',
                  mt: 1,
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                }}
              >
                Discover the world through digital collectibles
              </Typography>
            </Box>

            {/* Email Body */}
            <Box sx={{ p: 4 }}>
              <Typography
                variant="h5"
                sx={{
                  mb: 3,
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Your NFT Has Been Claimed
              </Typography>

              <Typography variant="body1" sx={{ mb: 2, fontWeight: 300 }}>
                Hello Explorer,
              </Typography>

              <Typography variant="body1" sx={{ mb: 3, fontWeight: 300 }}>
                Congratulations! You have successfully claimed your digital
                collectible from the <strong>KAIROS Map</strong> collection.
                Your unique NFT is now safely stored in your wallet.
              </Typography>

              {/* NFT Card Preview */}
              <Box sx={{
                border: '1px solid #2483ff33',
                borderRadius: 0,
                p: 3,
                mb: 3,
                textAlign: 'center',
              }}>
                <Box sx={{
                  width: 200,
                  height: 200,
                  mx: 'auto',
                  mb: 2,
                  border: '1px solid #2483ff33',
                  borderRadius: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Typography variant="caption" sx={{ color: '#D8D4CC' }}>
                    [NFT IMAGE]
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Taipei City Boundary #001
                </Typography>
                <Typography variant="caption" sx={{ color: '#999', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  KAIROS Map Collection
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ mb: 3, fontWeight: 300 }}>
                You can view your NFT anytime in your connected wallet or on the KAIROS platform.
              </Typography>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: '#2483ff',
                    borderRadius: 0,
                    px: 4,
                    py: 1,
                    fontSize: '11px',
                    fontWeight: 400,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: '#1a6fd6',
                      boxShadow: 'none',
                    },
                  }}
                >
                  View My NFT
                </Button>
              </Box>

              <Typography variant="body2" sx={{ color: '#D8D4CC', fontWeight: 300 }}>
                If you did not request this email, please ignore it or contact our support team.
              </Typography>
            </Box>

            {/* Email Footer */}
            <Box sx={{
              borderTop: '1px solid #2483ff33',
              p: 4,
              textAlign: 'center',
            }}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  mb: 2,
                  color: '#2483ff',
                  letterSpacing: '0.2em',
                }}
              >
                KAIROS
              </Typography>

              <Typography variant="caption" sx={{ display: 'block', mb: 2, color: '#999', fontWeight: 300 }}>
                You are receiving this email because you opted in to receive
                communications from KAIROS when claiming an NFT on our platform.
              </Typography>

              {/* Required Links */}
              <Box sx={{ mb: 2 }}>

                <Typography
                  component="a"
                  href="#"
                  variant="caption"
                  sx={{
                    color: '#ed5024',
                    textDecoration: 'underline',
                    mx: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 400,
                  }}
                >
                  Privacy Policy
                </Typography>
                <Typography component="span" variant="caption" sx={{ color: '#D8D4CC' }}>
                  |
                </Typography>
                <Typography
                  component="a"
                  href="#"
                  variant="caption"
                  sx={{
                    color: '#ed5024',
                    textDecoration: 'underline',
                    mx: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 400,
                  }}
                >
                  Manage Preferences
                </Typography>
              </Box>

              {/* Physical Mailing Address */}
              <Typography variant="caption" sx={{ display: 'block', color: '#999', fontWeight: 300, lineHeight: 1.8 }}>
                KAIROS Ltd.<br />
                3F., No. 123, Sec. 2, Dunhua S. Rd.,<br />
                Da&#39;an Dist., Taipei City 106, Taiwan
              </Typography>

              <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#D8D4CC', fontWeight: 300 }}>
                © 2026 KAIROS. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

