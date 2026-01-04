
import { GoogleAuth } from '../types';

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

export class GoogleService {
  private tokenClient: any = null;
  private currentClientId: string | null = null;
  private isInitializing: boolean = false;

  constructor() {
    try {
      this.currentClientId = localStorage.getItem('nutria_google_client_id');
    } catch (e) {
      console.warn("Local storage inacessível.");
    }
  }

  setClientId(id: string) {
    const cleanId = id.trim().replace(/[\s\t\n\r]/g, '');
    this.currentClientId = cleanId;
    try {
      localStorage.setItem('nutria_google_client_id', cleanId);
    } catch (e) {}
    this.tokenClient = null; 
  }

  getClientId(): string | null {
    return this.currentClientId;
  }

  isConfigured(): boolean {
    return !!(this.currentClientId && this.currentClientId.includes('.apps.googleusercontent.com'));
  }

  async ensureInitialized(): Promise<boolean> {
    if (this.tokenClient) return true;
    if (typeof window === 'undefined' || !this.isConfigured()) return false;
    
    let retries = 0;
    while (!(window as any).google && retries < 30) {
      await new Promise(r => setTimeout(r, 200));
      retries++;
    }
    
    if (!(window as any).google) return false;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      const google = (window as any).google;
      
      google.accounts.id.initialize({
        client_id: this.currentClientId,
        use_fedcm_for_prompt: false // Desativado para compatibilidade com AI Studio
      });

      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.currentClientId,
        scope: SCOPES,
        callback: '',
        prompt: 'consent select_account'
      });

      this.isInitializing = false;
      return true;
    } catch (e) {
      console.error("Init Error:", e);
      this.isInitializing = false;
      return false;
    }
  }

  async login(): Promise<GoogleAuth> {
    const ok = await this.ensureInitialized();
    if (!ok) throw new Error("SDK não carregado.");

    return new Promise((resolve, reject) => {
      this.tokenClient.callback = async (response: any) => {
        if (response.error) {
          reject(response);
          return;
        }
        
        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
          });
          const userData = await userRes.json();
          
          resolve({
            accessToken: response.access_token,
            expiresAt: Date.now() + (response.expires_in * 1000),
            user: {
              name: userData.name || 'Usuário NutrIA',
              email: userData.email,
              picture: userData.picture || ''
            }
          });
        } catch (e) {
          reject(e);
        }
      };

      try {
        this.tokenClient.requestAccessToken();
      } catch (err) {
        reject(err);
      }
    });
  }

  async syncAllData(token: string, data: any) {
    if (!token) return 'Local';
    
    const findOrCreateFolder = async (name: string, parentId?: string) => {
      const q = encodeURIComponent(`name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false ${parentId ? `and '${parentId}' in parents` : ''}`);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      
      if (d.files && d.files.length > 0) return d.files[0].id;

      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : [] })
      });
      const folder = await createRes.json();
      return folder.id;
    };

    const rootId = await findOrCreateFolder('NutrIA_Cloud');
    const backupId = await findOrCreateFolder(`Backup_${new Date().toISOString().split('T')[0]}`, rootId);

    const upload = async (name: string, content: any) => {
      const metadata = { name, parents: [backupId], mimeType: 'application/json' };
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));
      
      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
    };

    await Promise.all([
      upload('perfis.json', data.profiles),
      upload('refeicoes.json', data.meals),
      upload('receitas.json', data.recipes)
    ]);

    return "Drive/NutrIA_Cloud";
  }
}

export const googleService = new GoogleService();
