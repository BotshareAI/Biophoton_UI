import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import i18n from './i18n'
;(async () => {
  if (window.api?.cursorHidden) {
    document.body.classList.add('no-cursor')
  } else {
    document.body.classList.remove('no-cursor')
  }
  // Read saved locale before rendering to avoid flicker
  const savedLocale = await window.api.get('locale', 'en')
  await i18n.changeLanguage(savedLocale)
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  )
})()
