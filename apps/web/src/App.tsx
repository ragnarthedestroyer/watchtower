import { TokenDashboard } from '../../../packages/core/src/components/TokenDashboard';

function App() {
  return (
    <div className="App">
      <TokenDashboard 
        appId="WATCHTOWER_MAIN_WEB" 
        userAddress="0:YOUR_WALLET_ADDRESS_HERE" 
      />
    </div>
  );
}

export default App;
