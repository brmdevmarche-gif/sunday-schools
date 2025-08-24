"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { StudentAPI, type Student, type CreateStudentData, type UpdateStudentData } from "@/lib/student-api"
import { toast } from "@/hooks/use-toast"

// Hook to fetch all students
export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: StudentAPI.fetchStudents,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to create a new student
export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateStudentData) => StudentAPI.createStudent(data),
    onSuccess: (newStudent) => {
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: ["students"] })

      toast({
        title: "Student Created",
        description: `${newStudent.name} has been added successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create student.",
        variant: "destructive",
      })
    },
  })
}

// Hook to update an existing student
export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentData }) => StudentAPI.updateStudent(id, data),
    onSuccess: (updatedStudent) => {
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: ["students"] })

      // Also invalidate individual student profile if it exists
      queryClient.invalidateQueries({ queryKey: ["students", updatedStudent.id] })

      toast({
        title: "Student Updated",
        description: `${updatedStudent.name} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student.",
        variant: "destructive",
      })
    },
  })
}

// Hook to fetch a single student by ID
export function useStudent(id: string) {
  return useQuery({
    queryKey: ["students", id],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/students/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch student: ${response.statusText}`)
      }
      return response.json() as Promise<Student>
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}
