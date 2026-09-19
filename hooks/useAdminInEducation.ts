import { useIsAdmin } from './useIsAdmin';
import { useEducationPreview } from '../contexts/EducationPreviewContext';

export function useAdminInEducation(): boolean {
  const isAdmin = useIsAdmin();
  const { previewAsMember } = useEducationPreview();
  return isAdmin && !previewAsMember;
}
