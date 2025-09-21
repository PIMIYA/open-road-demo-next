// components/KukaiEmbedComponent.jsx
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { KukaiEmbed, Networks } from "kukai-embed";
import { Button } from "@mui/material";

/**（可選）在模組層做單例，避免多次掛載頁面時重複 new */
let singletonEmbed = null;
let singletonInitPromise = null;

const KukaiEmbedComponent = forwardRef(({ onLoginSuccess }, ref) => {
  const containerRef = useRef(null); // 直接抓 DOM，不用靠 id 查
  const embedRef = useRef(null); // 保存 KukaiEmbed 實例
  const initPromiseRef = useRef(null); // 保存 init() 的 Promise，避免並發
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);

  useImperativeHandle(ref, () => ({
    /** 給父層呼叫的安全登出 */
    logout: async () => {
      try {
        const embed = embedRef.current || singletonEmbed;
        if (embed) {
          await embed.logout();
          setIsLoggedIn(false);
        }
      } catch (e) {
        console.error("Error during logout:", e);
      }
    },
  }));

  /** 懶初始化：需要時才做，且一定等到 container 存在 */
  const ensureInitialized = async () => {
    if (typeof window === "undefined") return null;

    // 若已有單例與初始化承諾，直接沿用
    if (singletonEmbed && singletonInitPromise) {
      await singletonInitPromise;
      embedRef.current = singletonEmbed;
      return singletonEmbed;
    }

    // 若尚未 new，這裡 new；一定要確保 containerRef.current 存在
    if (!embedRef.current) {
      const el = containerRef.current;
      if (!el) throw new Error("Kukai container not mounted yet.");

      const embed = new KukaiEmbed({
        net: Networks.mainnet,
        element: el,
        // 其他可選參數…例如 theme、locale 等（依官方文件）
      });

      embedRef.current = embed;
      singletonEmbed = embed;

      const p = embed
        .init()
        .then(() => {
          // 若已登入（回流/快取），同步 flag
          if (embed.user) setIsLoggedIn(true);
        })
        .catch((err) => {
          console.error("Error during initialization:", err);
          throw err;
        });

      initPromiseRef.current = p;
      singletonInitPromise = p;
    }

    await (initPromiseRef.current || singletonInitPromise);
    return embedRef.current;
  };

  /** login flow：嚴格保證 init 完成再 login */
  const handleLogin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const embed = await ensureInitialized(); // 等待 init 完成
      if (!embed) throw new Error("Embed not available");

      const userInfo = await embed.login({
        loginOptions: ["google"],
        wideButtons: [true],
        showBackButton: [true],
      });

      if (userInfo) {
        setIsLoggedIn(true);
        onLoginSuccess?.(userInfo);
      }
    } catch (error) {
      console.error("Error during login:", error);
      // 這裡可往上拋或顯示 UI 錯誤訊息
    } finally {
      setBusy(false);
    }
  };

  /** 清理：離開頁面時銷毀或登出 */
  // useEffect(() => {
  //   return () => {
  // 要不要在 unmount 時自動 logout/destroy
  // 如果不同頁面之間要共用登入狀態，就不要 destroy。
  // 如果想完全乾淨，打開下面這段：
  // (async () => {
  //   try {
  //     const embed = embedRef.current;
  //     if (embed) {
  //       await embed.logout();
  //       // 沒有官方 destroy 也 OK，讓 iframe 留著也不影響
  //     }
  //   } catch {}
  // })();
  //   };
  // }, []);

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        marginTop: 16,
        gap: 8,
      }}
    >
      <div style={{ minHeight: 1 }} />
      <Button
        onClick={isLoggedIn ? ref?.current?.logout : handleLogin}
        disabled={busy}
        sx={{
          backgroundColor: "#007bff",
          color: "#fff",
          px: 2,
          py: 1,
          borderRadius: "4px",
          "&:hover": { backgroundColor: "#0056b3" },
        }}
      >
        {isLoggedIn ? "Logout" : busy ? "Connecting..." : "click to claim NFT"}
      </Button>

      {/* 關鍵：容器永遠存在（但不一定要可見） */}
      <div
        ref={containerRef}
        id="kukai-container"
        style={{
          // 你可以保持隱藏或縮到 0；Kukai 內部會把 iframe 掛到這裡
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
      />
    </div>
  );
});

export default KukaiEmbedComponent;
