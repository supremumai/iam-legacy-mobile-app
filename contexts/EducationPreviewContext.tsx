import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface EducationPreviewContextType {
  previewAsMember: boolean;
  togglePreview: () => void;
}

const EducationPreviewContext = createContext<EducationPreviewContextType>({
  previewAsMember: false,
  togglePreview: () => {},
});

export function useEducationPreview(): EducationPreviewContextType {
  return useContext(EducationPreviewContext);
}

export function EducationPreviewProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [previewAsMember, setPreviewAsMember] = useState(false);

  useEffect(() => {
    if (!session) setPreviewAsMember(false);
  }, [session]);

  function togglePreview() {
    setPreviewAsMember((v) => !v);
  }

  return (
    <EducationPreviewContext.Provider value={{ previewAsMember, togglePreview }}>
      {children}
    </EducationPreviewContext.Provider>
  );
}
