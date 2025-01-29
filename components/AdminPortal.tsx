"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LogOut, User, ArrowRight, Lock, Plus, Edit, Trash2, Save, X, FileText, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import { Toaster, toast } from "react-hot-toast"

// API base URL
const API_URL = "http://localhost:5000/api"

// Interface definitions
interface Question {
  _id: string
  section: string
  text: string
  options?: string[]
  answer?: string
  testCases?: { input: string; output: string; isHidden: boolean }[]
  createdBy: string
  createdAt: string
}

interface User {
  _id: string
  name: string
  email: string
  role: string
}

interface Submission {
  _id: string
  user: {
    _id: string
    email: string
  }
  answers: {
    question: string
    answer: string
    isCorrect: boolean
  }[]
  score: number
  status: string
  startTime: string
  endTime?: string
}

const SECTIONS = ["mcqs", "aptitude", "ai", "coding"]

const AdminPortal: React.FC = () => {
  // State declarations
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    section: "",
    text: "",
    options: ["", "", "", ""],
    answer: "",
    testCases: [{ input: "", output: "", isHidden: false }],
  })
  const [users, setUsers] = useState<User[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Effect for token retrieval and initialization
  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
      setIsLoggedIn(true)
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
    }
  }, [])

  // Effect for fetching data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchQuestions()
      fetchUsers()
      fetchSubmissions()
    }
  }, [isLoggedIn])

  // Function to fetch questions
  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/questions/`)
      const fetchedQuestions = Array.isArray(response.data.data) ? response.data.data : []
      setQuestions(fetchedQuestions)
    } catch (error) {
      console.error("Error fetching questions:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Session expired. Please log in again.")
        handleLogout()
      } else {
        toast.error("Failed to fetch questions")
      }
    }
  }

  // Function to fetch users
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`)
      setUsers(response.data.users)
    } catch (error) {
      console.error("Error fetching users:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Session expired. Please log in again.")
        handleLogout()
      } else {
        toast.error("Failed to fetch users")
      }
    }
  }

  // Function to fetch submissions
  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/exams`)
      setSubmissions(response.data.exams)
    } catch (error) {
      console.error("Error fetching submissions:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Session expired. Please log in again.")
        handleLogout()
      } else {
        toast.error("Failed to fetch submissions")
      }
    }
  }

  // Function to handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      })

      const { token } = response.data
      setToken(token)
      setIsLoggedIn(true)
      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      toast.success("Successfully logged in")
      await fetchQuestions()
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  // Function to handle logout
  const handleLogout = () => {
    setIsLoggedIn(false)
    setToken("")
    setEmail("")
    setPassword("")
    setUsers([])
    setSubmissions([])
    setQuestions([])
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    toast.success("Logged out successfully")
  }

  // Function to handle adding a new question
  const handleAddQuestion = async () => {
    if (!newQuestion.text || newQuestion.text.trim() === "") {
      toast.error("Question text is required")
      return
    }

    if (newQuestion.section === "mcqs" || newQuestion.section === "ai" || newQuestion.section === "aptitude") {
      const validOptions = newQuestion.options?.filter((option) => option.trim() !== "")
      if (!validOptions || validOptions.length !== 4) {
        toast.error("4 non-empty options are required for MCQs, AI, and Aptitude questions")
        return
      }
      if (!newQuestion.answer) {
        toast.error("An answer is required for MCQs, AI, and Aptitude questions")
        return
      }
    }

    if (newQuestion.section === "coding") {
      if (!newQuestion.testCases || newQuestion.testCases.length === 0) {
        toast.error("At least one test case is required for coding questions")
        return
      }
    }

    try {
      const questionToSend = { ...newQuestion }

      if (questionToSend.testCases) {
        questionToSend.testCases = questionToSend.testCases.filter(
          (testCase) => testCase.input.trim() !== "" && testCase.output.trim() !== "",
        )
      }

      if (questionToSend.section === "coding") {
        delete questionToSend.options
        delete questionToSend.answer
      }

      const response = await axios.post(`${API_URL}/questions/`, questionToSend)

      if (response.data.success) {
        const addedQuestion = response.data.data
        setQuestions([...questions, addedQuestion])
        setNewQuestion({
          section: "",
          text: "",
          options: ["", "", "", ""],
          answer: "",
          testCases: [{ input: "", output: "", isHidden: false }],
        })
        toast.success(`Question "${addedQuestion.text}" added successfully!`, {
          icon: "✅",
          position: "top-center",
        })
      } else {
        throw new Error(response.data.message || "Failed to add question")
      }
    } catch (error) {
      console.error("Error adding question:", error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Session expired. Please log in again.", {
            icon: "❌",
          })
          handleLogout()
        } else {
          toast.error(`Failed to add question: ${error.response?.data.message || "Unknown error"}`, {
            icon: "❌",
          })
        }
      } else {
        toast.error(`Failed to add question: ${error instanceof Error ? error.message : "Unknown error"}`, {
          icon: "❌",
        })
      }
    }
  }

  // Function to handle updating a question
  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return

    try {
      const response = await axios.put(`${API_URL}/questions/${editingQuestion._id}`, editingQuestion)

      if (response.data.success) {
        const updatedQuestions = questions.map((q) => (q._id === editingQuestion._id ? response.data.data : q))
        setQuestions(updatedQuestions)
        setEditingQuestion(null)
        setIsEditModalOpen(false)
        toast.success("Question updated successfully!")
      }
    } catch (error) {
      console.error("Error updating question:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Session expired. Please log in again.")
        handleLogout()
      } else {
        toast.error("Failed to update question")
      }
    }
  }

  // Function to handle deleting a question
  const handleDeleteQuestion = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/questions/${id}`)
      setQuestions(questions.filter((q) => q._id !== id))
      toast.success("Question deleted successfully!", {
        icon: "🗑️",
        position: "top-center",
      })
    } catch (error) {
      console.error("Error deleting question:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Session expired. Please log in again.", {
          icon: "❌",
        })
        handleLogout()
      } else {
        toast.error("Failed to delete question", {
          icon: "❌",
        })
      }
    }
  }

  // Function to handle adding a new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await axios.post(`${API_URL}/auth/register`, newUser)
      setUsers([...users, response.data])
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "user",
      })
      toast.success(`User ${newUser.name} added successfully!`, {
        icon: "👤",
        position: "top-center",
      })
    } catch (error) {
      console.error("Error adding user:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Session expired. Please log in again.", {
          icon: "❌",
        })
        handleLogout()
      } else {
        toast.error("Failed to add user", {
          icon: "❌",
        })
      }
    }
  }

  // Function to handle deleting a user
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`${API_URL}/admin/users/${userId}`)
        setUsers(users.filter((user) => user._id !== userId))
        toast.success(`User deleted successfully!`, {
          icon: "🗑️",
          position: "top-center",
        })
      } catch (error) {
        console.error("Error deleting user:", error)
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          toast.error("Session expired. Please log in again.", {
            icon: "❌",
          })
          handleLogout()
        } else {
          toast.error("Failed to delete user", {
            icon: "❌",
          })
        }
      }
    }
  }

  // Function to handle section click
  const handleSectionClick = (section: string) => {
    setActiveSection(section === activeSection ? null : section)
  }

  // Render login form if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4">
        <div className="relative w-full max-w-md">
          <div className="absolute -top-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

          <div className="relative bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.02]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LNRS Admin Portal
              </h2>
              <p className="text-gray-600 mt-2">Sign in to manage questions and users</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Render main admin portal content if logged in
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-8">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
            padding: "16px",
            borderRadius: "8px",
            fontSize: "16px",
            maxWidth: "400px",
            textAlign: "center",
          },
        }}
      />
      <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-5 w-5" />
            <span>Log Out</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => handleSectionClick("questions")}
            variant={activeSection === "questions" ? "default" : "outline"}
            className="w-full"
          >
            <Edit className="w-4 h-4 mr-2" />
            Question Management
          </Button>
          <Button
            onClick={() => handleSectionClick("users")}
            variant={activeSection === "users" ? "default" : "outline"}
            className="w-full"
          >
            <User className="w-4 h-4 mr-2" />
            User Management
          </Button>
          <Button
            onClick={() => handleSectionClick("submissions")}
            variant={activeSection === "submissions" ? "default" : "outline"}
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            Exam Submissions
          </Button>
          <Button
            onClick={() => handleSectionClick("signup")}
            variant={activeSection === "signup" ? "default" : "outline"}
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        </div>

        {activeSection === "questions" && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4">Add New Question</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newQuestion.section}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  placeholder="Question text"
                  required
                />

                {(newQuestion.section === "mcqs" ||
                  newQuestion.section === "ai" ||
                  newQuestion.section === "aptitude") && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {newQuestion.options?.map((option, index) => (
                        <Input
                          key={`new-option-${index}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(newQuestion.options || [])]
                            newOptions[index] = e.target.value
                            setNewQuestion({ ...newQuestion, options: newOptions })
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                    </div>
                    <Input
                      value={newQuestion.answer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                      placeholder="Correct answer"
                    />
                  </div>
                )}

                {newQuestion.section === "coding" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Test Cases</h3>
                      {newQuestion.testCases?.map((testCase, index) => (
                        <div key={`new-testcase-${index}`} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                          <div>
                            <label className="text-sm text-gray-600">Input</label>
                            <Input
                              value={testCase.input}
                              onChange={(e) => {
                                const newTestCases = [...(newQuestion.testCases || [])]
                                newTestCases[index].input = e.target.value
                                setNewQuestion({ ...newQuestion, testCases: newTestCases })
                              }}
                              placeholder="Input"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Expected Output</label>
                            <Input
                              value={testCase.output}
                              onChange={(e) => {
                                const newTestCases = [...(newQuestion.testCases || [])]
                                newTestCases[index].output = e.target.value
                                setNewQuestion({ ...newQuestion, testCases: newTestCases })
                              }}
                              placeholder="Output"
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={() =>
                          setNewQuestion({
                            ...newQuestion,
                            testCases: [...(newQuestion.testCases || []), { input: "", output: "", isHidden: false }],
                          })
                        }
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Case
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={handleAddQuestion} className="mt-6">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-6">Existing Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SECTIONS.map((section) => (
                  <div key={`section-${section}`} className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">{section.toUpperCase()}</h3>
                    <div className="space-y-4">
                      {questions
                        .filter((q) => q.section === section)
                        .map((question) => (
                          <div
                            key={`question-${question._id}`}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{question.text}</p>
                                <p className="text-sm text-gray-500 mt-1">Type: {question.section}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    setEditingQuestion(question)
                                    setIsEditModalOpen(true)
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteQuestion(question._id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {editingQuestion && isEditModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Edit Question</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditModalOpen(false)
                        setEditingQuestion(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <Input
                      value={editingQuestion.text}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                      placeholder="Question text"
                    />

                    {(editingQuestion.section === "mcqs" ||
                      editingQuestion.section === "ai" ||
                      editingQuestion.section === "aptitude") && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {editingQuestion.options?.map((option, index) => (
                            <Input
                              key={`edit-option-${index}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(editingQuestion.options || [])]
                                newOptions[index] = e.target.value
                                setEditingQuestion({
                                  ...editingQuestion,
                                  options: newOptions,
                                })
                              }}
                              placeholder={`Option ${index + 1}`}
                            />
                          ))}
                        </div>
                        <Input
                          value={editingQuestion.answer}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              answer: e.target.value,
                            })
                          }
                          placeholder="Correct answer"
                        />
                      </div>
                    )}

                    {editingQuestion.section === "coding" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-medium">Test Cases</h3>
                          {editingQuestion.testCases?.map((testCase, index) => (
                            <div
                              key={`edit-testcase-${index}`}
                              className="grid grid-cols-2 gap-4 p-4 border rounded-lg"
                            >
                              <div>
                                <label className="text-sm text-gray-600">Input</label>
                                <Input
                                  value={testCase.input}
                                  onChange={(e) => {
                                    const newTestCases = [...(editingQuestion.testCases || [])]
                                    newTestCases[index].input = e.target.value
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      testCases: newTestCases,
                                    })
                                  }}
                                  placeholder="Input"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-600">Expected Output</label>
                                <Input
                                  value={testCase.output}
                                  onChange={(e) => {
                                    const newTestCases = [...(editingQuestion.testCases || [])]
                                    newTestCases[index].output = e.target.value
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      testCases: newTestCases,
                                    })
                                  }}
                                  placeholder="Output"
                                />
                              </div>
                            </div>
                          ))}
                          <Button
                            onClick={() =>
                              setEditingQuestion({
                                ...editingQuestion,
                                testCases: [
                                  ...(editingQuestion.testCases || []),
                                  { input: "", output: "", isHidden: false },
                                ],
                              })
                            }
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Test Case
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditModalOpen(false)
                        setEditingQuestion(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateQuestion}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "users" && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={`user-${user._id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user._id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          onClick={() => handleDeleteUser(user._id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "submissions" && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-6">Exam Submissions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={`submission-${submission._id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{submission.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.score}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            submission.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(submission.startTime).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "signup" && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-6">Add New User</h2>
            <form onSubmit={handleAddUser} className="max-w-md space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPortal

