"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  LogOut,
  User,
  ArrowRight,
  Lock,
  Plus,
  Edit,
  Trash2,
  FileText,
  UserPlus,
  ChevronRight,
  ArrowLeft,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// API base URL
const API_URL = "http://localhost:5000/api"

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

const FullPageQuestions: React.FC<{
  questions: Question[]
  onUpdateQuestion: (question: Question) => void
  onDeleteQuestion: (id: string) => void
  onBack: () => void
  section: string
}> = ({ questions, onUpdateQuestion, onDeleteQuestion, onBack, section }) => {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const filteredQuestions = questions.filter((q) => q.section === section)

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
  }

  const handleSaveQuestion = () => {
    if (editingQuestion) {
      onUpdateQuestion(editingQuestion)
      setEditingQuestion(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingQuestion(null)
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{section.toUpperCase()} Questions</h2>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sections
          </Button>
        </div>
        {filteredQuestions.length > 0 ? (
          <div className="space-y-8">
            {filteredQuestions.map((question, index) => (
              <div key={`${question._id}-${index}`} className="bg-white p-6 rounded-xl shadow-md">
                {editingQuestion && editingQuestion._id === question._id ? (
                  <div className="space-y-4">
                    <Input
                      value={editingQuestion.text}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                      placeholder="Question text"
                    />
                    {(section === "mcqs" || section === "ai" || section === "aptitude") && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Options:</h4>
                        {editingQuestion.options?.map((option, optionIndex) => (
                          <Input
                            key={optionIndex}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(editingQuestion.options || [])]
                              newOptions[optionIndex] = e.target.value
                              setEditingQuestion({ ...editingQuestion, options: newOptions })
                            }}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                        ))}
                        <Input
                          value={editingQuestion.answer}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, answer: e.target.value })}
                          placeholder="Correct answer"
                        />
                      </div>
                    )}
                    {section === "coding" && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Test Cases:</h4>
                        {editingQuestion.testCases?.map((testCase, testCaseIndex) => (
                          <div key={testCaseIndex} className="grid grid-cols-2 gap-4">
                            <Input
                              value={testCase.input}
                              onChange={(e) => {
                                const newTestCases = [...(editingQuestion.testCases || [])]
                                newTestCases[testCaseIndex].input = e.target.value
                                setEditingQuestion({ ...editingQuestion, testCases: newTestCases })
                              }}
                              placeholder="Input"
                            />
                            <Input
                              value={testCase.output}
                              onChange={(e) => {
                                const newTestCases = [...(editingQuestion.testCases || [])]
                                newTestCases[testCaseIndex].output = e.target.value
                                setEditingQuestion({ ...editingQuestion, testCases: newTestCases })
                              }}
                              placeholder="Expected Output"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      <Button onClick={handleCancelEdit} variant="outline">
                        Cancel
                      </Button>
                      <Button onClick={handleSaveQuestion}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-medium text-gray-900">Question {index + 1}</h3>
                        <p className="text-lg mt-2">{question.text}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => handleEditQuestion(question)} variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => onDeleteQuestion(question._id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {(section === "mcqs" || section === "ai" || section === "aptitude") && (
                      <div className="mt-4">
                        <h4 className="font-medium">Options:</h4>
                        <ul className="list-disc list-inside">
                          {question.options?.map((option, optionIndex) => (
                            <li key={optionIndex} className="text-gray-700">
                              {option}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2">
                          <span className="font-medium">Correct answer:</span> {question.answer}
                        </p>
                      </div>
                    )}
                    {section === "coding" && (
                      <div className="mt-4">
                        <h4 className="font-medium">Test Cases:</h4>
                        <div className="space-y-2">
                          {question.testCases?.map((testCase, testCaseIndex) => (
                            <div key={testCaseIndex} className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium">Input:</span> {testCase.input}
                              </div>
                              <div>
                                <span className="font-medium">Expected Output:</span> {testCase.output}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-xl text-gray-600">No questions available for this section.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const AdminPortal: React.FC = () => {
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  })
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
      setIsLoggedIn(true)
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      fetchQuestions()
      fetchUsers()
      fetchSubmissions()
    }
  }, [isLoggedIn])

  const fetchQuestions = async () => {
    setIsLoadingQuestions(true)
    try {
      const allQuestions: Question[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const response = await axios.get(`${API_URL}/questions`, {
          params: { page, limit: 100 }, // Fetch 100 questions per request
        })

        if (response.data.success && Array.isArray(response.data.data)) {
          const fetchedQuestions = response.data.data
          allQuestions.push(...fetchedQuestions)

          if (fetchedQuestions.length < 100) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }

      // Remove duplicates based on _id
      const uniqueQuestions = allQuestions.filter(
        (question: Question, index: number, self: Question[]) =>
          index === self.findIndex((t: Question) => t._id === question._id),
      )

      setQuestions(uniqueQuestions)
      if (uniqueQuestions.length === 0) {
        toast.info("No questions found")
      }
      //Removed toast message for fetched questions
    } catch (error) {
      console.error("Error fetching questions:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Session expired. Please log in again.")
        handleLogout()
      } else {
        toast.error("Failed to fetch questions")
      }
    } finally {
      setIsLoadingQuestions(false)
    }
  }

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
        toast.success(`Question added successfully`)
        // Refetch questions to ensure the list is up-to-date
        fetchQuestions()
        setNewQuestion({
          section: "",
          text: "",
          options: ["", "", "", ""],
          answer: "",
          testCases: [{ input: "", output: "", isHidden: false }],
        })
      } else {
        throw new Error(response.data.message || "Failed to add question")
      }
    } catch (error) {
      console.error("Error adding question:", error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Session expired. Please log in again.")
          handleLogout()
        } else {
          toast.error(`Failed to add question: ${error.response?.data.message || "Unknown error"}`)
        }
      } else {
        toast.error(`Failed to add question: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  }

  const handleUpdateQuestion = async (updatedQuestion: Question) => {
    try {
      const response = await axios.put(`${API_URL}/questions/${updatedQuestion._id}`, updatedQuestion)
      const updatedQuestions = questions.map((q) => (q._id === updatedQuestion._id ? response.data.data : q))
      setQuestions(updatedQuestions)
      toast.success("Question updated successfully")
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

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        await axios.delete(`${API_URL}/questions/${id}`)
        setQuestions((prevQuestions) => prevQuestions.filter((q) => q._id !== id))
        toast.success("Question deleted successfully")
        // Refetch questions to ensure the list is up-to-date
        fetchQuestions()
      } catch (error) {
        console.error("Error deleting question:", error)
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          toast.error("Session expired. Please log in again.")
          handleLogout()
        } else {
          toast.error("Failed to delete question")
        }
      }
    }
  }

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
      toast.success("User added successfully")
    } catch (error) {
      console.error("Error adding user:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Session expired. Please log in again.")
        handleLogout()
      } else {
        toast.error("Failed to add user")
      }
    }
  }

  const handleEditUser = (user: User) => {
    console.log("Edit user:", user)
    // Implement edit user functionality
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`${API_URL}/admin/users/${userId}`)
        setUsers(users.filter((user) => user._id !== userId))
        toast.success("User deleted successfully")
      } catch (error) {
        console.error("Error deleting user:", error)
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          toast.error("Session expired. Please log in again.")
          handleLogout()
        } else {
          toast.error("Failed to delete user")
        }
      }
    }
  }

  const handleSectionClick = (section: string) => {
    setActiveSection(section === activeSection ? null : section)
  }

  const handleExpandSection = (section: string) => {
    setExpandedSection(section === expandedSection ? null : section)
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-8">
      <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl h-[calc(100vh-4rem)] flex flex-col">
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

        <div className="flex-1 overflow-y-auto">
          {activeSection === "questions" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              <div className="bg-white p-6 rounded-xl shadow-md h-full overflow-y-auto">
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
                            key={index}
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
                          <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
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

              <div className="bg-white p-6 rounded-xl shadow-md h-full overflow-y-auto">
                <h2 className="text-xl font-semibold mb-6">Existing Questions</h2>
                {isLoadingQuestions ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : expandedSection ? (
                  <FullPageQuestions
                    questions={questions}
                    onUpdateQuestion={handleUpdateQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onBack={() => setExpandedSection(null)}
                    section={expandedSection}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SECTIONS.map((section, index) => (
                      <div
                        key={`section-${section}-${index}`}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleExpandSection(section)}
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900">{section.toUpperCase()}</h3>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {isLoadingQuestions
                            ? "Loading..."
                            : `${questions.filter((q) => q.section === section).length} questions`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                    {users.map((user, index) => (
                      <tr key={`user-${user._id}-${index}`} className="hover:bg-gray-50">
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
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green800">
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
                <table className="min-w-full dividey divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    {submissions.map((submission, index) => (
                      <tr key={`submission-${submission._id}-${index}`} className="hover:bg-gray-50">
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
        <ToastContainer position="top-center" autoClose={3000} style={{ zIndex: 9999 }} />
      </div>
    </div>
  )
}

export default AdminPortal

