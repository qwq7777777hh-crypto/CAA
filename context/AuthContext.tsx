
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (userData: any) => void;
  logout: () => void;
  updateUser: (newData: any) => void;
  incrementEvolution: () => void;
  sendFriendRequest: (targetUid: string) => Promise<{success: boolean, msg: string}>;
  searchUserByUid: (uid: string) => Promise<any | null>;
  changeCustomUid: (newUid: string) => Promise<{success: boolean, msg: string}>;
  requestDbAccess: (targetUid: string) => Promise<{success: boolean, msg: string}>;
  approveDbAccess: (requesterUid: string) => Promise<{success: boolean, msg: string}>;
  checkDbPermission: (ownerUid: string, viewerUid: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('neural_x_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        
        if (window.firebaseDB) {
          const emailKey = parsed.email.replace(/\./g, ',');
          window.firebaseDB.ref(`users/${emailKey}`).on('value', (snapshot: any) => {
            const latestData = snapshot.val();
            if (latestData) {
              setUser(latestData);
              localStorage.setItem('neural_x_user', JSON.stringify(latestData));
            }
          });
        }
      } catch (e) {
        localStorage.removeItem('neural_x_user');
      }
    }
    
    return () => {
      if (user && window.firebaseDB) {
        const emailKey = user.email.replace(/\./g, ',');
        window.firebaseDB.ref(`users/${emailKey}`).off();
      }
    };
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const login = (userData: any) => {
    localStorage.setItem('neural_x_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('neural_x_user');
    setUser(null);
  };

  const updateUser = (newData: any) => {
    if (!user || !window.firebaseDB) return;
    const emailKey = user.email.replace(/\./g, ',');
    window.firebaseDB.ref(`users/${emailKey}`).update(newData);
  };

  const incrementEvolution = () => {
    if (!user || !window.firebaseDB || !window.firebase) return;
    const emailKey = user.email.replace(/\./g, ',');
    const userRef = window.firebaseDB.ref(`users/${emailKey}`);
    userRef.child('evolutionInteractions').transaction((current: number) => {
      return (current || 0) + 1;
    });
  };

  const searchUserByUid = async (uid: string) => {
    if (!window.firebaseDB) return null;
    const cleanUid = uid.trim().toUpperCase();
    const mapSnap = await window.firebaseDB.ref(`uid_map/${cleanUid}`).once('value');
    const emailKey = mapSnap.val();
    if (!emailKey) return null;
    const userSnap = await window.firebaseDB.ref(`users/${emailKey}`).once('value');
    return userSnap.val();
  };

  const changeCustomUid = async (newUid: string) => {
    if (!user || user.uidChanged) return { success: false, msg: "LIMIT_REACHED" };
    const cleanUid = newUid.trim().toUpperCase();
    const existing = await window.firebaseDB.ref(`uid_map/${cleanUid}`).once('value');
    if (existing.val()) return { success: false, msg: "CONFLICT" };
    const emailKey = user.email.replace(/\./g, ',');
    const oldUid = user.customUid;
    await window.firebaseDB.ref(`uid_map/${cleanUid}`).set(emailKey);
    if (oldUid) await window.firebaseDB.ref(`uid_map/${oldUid}`).remove();
    await window.firebaseDB.ref(`users/${emailKey}`).update({ customUid: cleanUid, uidChanged: true });
    return { success: true, msg: "RECALIBRATION_COMPLETE." };
  };

  const sendFriendRequest = async (targetUid: string) => {
    if (!user) return { success: false, msg: "AUTH_REQUIRED" };
    if (targetUid === user.customUid) return { success: false, msg: "SELF_RECURSION_ERROR" };
    const targetUser = await searchUserByUid(targetUid);
    if (!targetUser) return { success: false, msg: "NODE_NOT_FOUND" };
    const myEmailKey = user.email.replace(/\./g, ',');
    const targetEmailKey = targetUser.email.replace(/\./g, ',');
    if (user.friends && user.friends.includes(targetUid)) return { success: false, msg: "ALREADY_LINKED" };
    const myFriends = [...(user.friends || []), targetUid];
    const targetFriends = [...(targetUser.friends || []), user.customUid];
    await window.firebaseDB.ref(`users/${myEmailKey}/friends`).set(myFriends);
    await window.firebaseDB.ref(`users/${targetEmailKey}/friends`).set(targetFriends);
    return { success: true, msg: "NEURAL_LINK_ESTABLISHED" };
  };

  // 新增：申请访问数据库
  const requestDbAccess = async (targetUid: string) => {
    if (!user) return { success: false, msg: "AUTH_REQUIRED" };
    await window.firebaseDB.ref(`db_requests/${targetUid}/${user.customUid}`).set(true);
    return { success: true, msg: "ACCESS_REQUEST_TRANSMITTED." };
  };

  // 新增：批准访问申请
  const approveDbAccess = async (requesterUid: string) => {
    if (!user) return { success: false, msg: "AUTH_REQUIRED" };
    await window.firebaseDB.ref(`db_permissions/${user.customUid}/${requesterUid}`).set(true);
    await window.firebaseDB.ref(`db_requests/${user.customUid}/${requesterUid}`).remove();
    return { success: true, msg: "PERMISSION_GRANTED." };
  };

  // 新增：检查权限
  const checkDbPermission = async (ownerUid: string, viewerUid: string) => {
    if (!window.firebaseDB) return false;
    if (ownerUid === viewerUid) return true;
    const snap = await window.firebaseDB.ref(`db_permissions/${ownerUid}/${viewerUid}`).once('value');
    return snap.val() === true;
  };

  return (
    <AuthContext.Provider value={{ 
        user, isAuthModalOpen, openAuthModal, closeAuthModal, 
        login, logout, updateUser, incrementEvolution,
        sendFriendRequest, searchUserByUid, changeCustomUid,
        requestDbAccess, approveDbAccess, checkDbPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
