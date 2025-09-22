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
            {loading ? '發送中...' : '發送測試郵件'}
          </Button>
        </Box>

        {result && (
          <Paper 
            sx={{ 
              p: 3, 
              backgroundColor: result.success ? '#e8f5e8' : '#ffeaea',
              border: `1px solid ${result.success ? '#4caf50' : '#f44336'}`
            }}
          >
            <Typography 
              variant="h6" 
              color={result.success ? 'success.main' : 'error.main'}
              gutterBottom
            >
              {result.success ? '✅ 測試成功' : '❌ 測試失敗'}
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
                <Typography variant="body2" component="pre" sx={{ 
                  backgroundColor: '#f5f5f5', 
                  p: 2, 
                  borderRadius: 1,
                  fontSize: '0.8rem',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(result.config, null, 2)}
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        <Box sx={{ mt: 4, p: 2, backgroundColor: '#f0f8ff', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            📝 使用說明：
          </Typography>
          <Typography variant="body2" component="div">
            1. 確保在 <code>.env.local</code> 中設置了正確的 SMTP 配置<br/>
            2. 輸入你的郵箱地址<br/>
            3. 點擊「發送測試郵件」<br/>
            4. 檢查你的郵箱是否收到測試郵件
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

