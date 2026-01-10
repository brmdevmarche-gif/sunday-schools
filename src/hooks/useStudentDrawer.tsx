"use client";

import * as React from "react";
import type { StudentDetails } from "@/components/teacher/StudentDrawer";

interface UseStudentDrawerReturn {
  /** Currently selected student */
  student: StudentDetails | null;
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Whether data is loading */
  isLoading: boolean;
  /** Open the drawer with a student ID */
  openDrawer: (studentId: string) => void;
  /** Close the drawer */
  closeDrawer: () => void;
  /** Set the drawer open state */
  setIsOpen: (open: boolean) => void;
}

/**
 * useStudentDrawer - Hook for managing student drawer state and data fetching
 *
 * @example
 * ```tsx
 * const { student, isOpen, isLoading, openDrawer, closeDrawer } = useStudentDrawer();
 *
 * // Open drawer with student ID
 * openDrawer("student-123");
 *
 * // Render drawer
 * <StudentDrawer
 *   student={student}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   loading={isLoading}
 * />
 * ```
 */
export function useStudentDrawer(): UseStudentDrawerReturn {
  const [student, setStudent] = React.useState<StudentDetails | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const openDrawer = React.useCallback(async (studentId: string) => {
    setIsLoading(true);
    setIsOpen(true);

    try {
      const response = await fetch(`/api/teacher/students/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setStudent(data);
      } else {
        console.error("Failed to fetch student data");
        setStudent(null);
      }
    } catch (error) {
      console.error("Error fetching student:", error);
      setStudent(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeDrawer = React.useCallback(() => {
    setIsOpen(false);
    // Delay clearing student data for smooth animation
    setTimeout(() => {
      setStudent(null);
    }, 300);
  }, []);

  const handleSetIsOpen = React.useCallback(
    (open: boolean) => {
      if (!open) {
        closeDrawer();
      } else {
        setIsOpen(true);
      }
    },
    [closeDrawer]
  );

  return {
    student,
    isOpen,
    isLoading,
    openDrawer,
    closeDrawer,
    setIsOpen: handleSetIsOpen,
  };
}

// Context for sharing drawer state across components
interface StudentDrawerContextValue extends UseStudentDrawerReturn {}

const StudentDrawerContext = React.createContext<StudentDrawerContextValue | null>(
  null
);

interface StudentDrawerProviderProps {
  children: React.ReactNode;
}

/**
 * StudentDrawerProvider - Context provider for student drawer
 *
 * Wrap your layout with this provider to share drawer state across pages.
 */
export function StudentDrawerProvider({ children }: StudentDrawerProviderProps) {
  const drawerState = useStudentDrawer();

  return (
    <StudentDrawerContext.Provider value={drawerState}>
      {children}
    </StudentDrawerContext.Provider>
  );
}

/**
 * useStudentDrawerContext - Use the student drawer from context
 *
 * Must be used within a StudentDrawerProvider.
 */
export function useStudentDrawerContext(): StudentDrawerContextValue {
  const context = React.useContext(StudentDrawerContext);
  if (!context) {
    throw new Error(
      "useStudentDrawerContext must be used within a StudentDrawerProvider"
    );
  }
  return context;
}
