import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import ErrorToast from '../components/ErrorToast'

let globalHandler = () => {}
export const setGlobalErrorHandler = (fn) => {
  globalHandler = fn
}
export const emitGlobalError = (msg) => {
  if (typeof globalHandler === 'function') {
    globalHandler(msg)
  }
}

const ErrorToastContext = createContext({ showError: () => {} })

export function ErrorToastProvider({ children }) {
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const [visible, setVisible] = useState(false)

  const showError = useCallback((msg) => {
    if (!msg) return
    setQueue(q => [...q, msg])
  }, [])

  useEffect(() => {
    setGlobalErrorHandler(showError)
  }, [showError])

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      setQueue(q => q.slice(1))
      setVisible(true)
    }
  }, [queue, current])

  useEffect(() => {
    if (visible) {
      const id = setTimeout(() => setVisible(false), 5000)
      return () => clearTimeout(id)
    }
  }, [visible])

  useEffect(() => {
    if (!visible && current) {
      const id = setTimeout(() => setCurrent(null), 300)
      return () => clearTimeout(id)
    }
  }, [visible, current])

  const handleClose = () => setVisible(false)

  return (
    <ErrorToastContext.Provider value={{ showError }}>
      {children}
      {current && (
        <ErrorToast message={current} visible={visible} onClose={handleClose} />
      )}
    </ErrorToastContext.Provider>
  )
}

export const useErrorToast = () => useContext(ErrorToastContext)
