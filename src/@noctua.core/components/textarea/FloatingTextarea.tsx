import type React from 'react'
import { useState } from 'react'
import { Textarea } from '@mantine/core'
import type { TextareaProps } from '@mantine/core'
import classes from './FloatingTextarea.module.css'

type FloatingTextareaProps = Omit<TextareaProps, 'classNames'> & {
  /** Drop the control's own border and padding — for use inside a wrapper that
   *  draws the outlined box itself, such as ChipInputField. */
  bare?: boolean
}

const FloatingTextarea: React.FC<FloatingTextareaProps> = ({
  value,
  onFocus,
  onBlur,
  label,
  bare = false,
  ...props
}) => {
  const [focused, setFocused] = useState(false)
  const hasLabel = label !== undefined && label !== ''
  const hasValue = typeof value === 'string' && value.length > 0
  const floating = focused || hasValue
  const inputClass = bare ? classes.inputBare : classes.input

  if (!hasLabel) {
    return (
      <Textarea
        {...props}
        value={value}
        onFocus={e => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={e => {
          setFocused(false)
          onBlur?.(e)
        }}
        classNames={{ input: inputClass }}
      />
    )
  }

  return (
    <div className={classes.wrap} data-floating={floating ? 'true' : 'false'}>
      <Textarea
        {...props}
        label={label}
        value={value}
        onFocus={e => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={e => {
          setFocused(false)
          onBlur?.(e)
        }}
        classNames={{ label: classes.label, input: inputClass }}
      />
    </div>
  )
}

export default FloatingTextarea
