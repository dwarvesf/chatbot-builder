import React, { type ReactNode } from 'react'

type RepeatProps = {
  count?: number
  children: ReactNode
}

export const Repeat: React.FC<RepeatProps> = ({ count = 6, children }) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <React.Fragment key={index}>{children}</React.Fragment>
      ))}
    </>
  )
}
