import { useEffect, useState } from "react";
import { getUserRole, isAuthed } from "../store/authStore";

// Determine whether the user has staff permissions
export default function useIsStaff() {
  const [isStaff, setIsStaff] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!isAuthed()) {
        setIsStaff(false);
        setLoadingRole(false);
        return;
      }

      try {
        const role = await getUserRole();
        setIsStaff(role?.isStaff || false);
      } catch {
        setIsStaff(false);
      } finally {
        setLoadingRole(false);
      }
    }

    fetchRole();
  }, []);

  return { isStaff, loadingRole };
}