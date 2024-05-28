import {
  Card,
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
  Typography,
} from '@mochi-ui/core'
import { useEffect, useState } from 'react'
import { SketchPicker } from 'react-color'

interface ColorData {
  defaultColor: string
  onChange: (color: string) => void
}

export const ColorPicker = ({ defaultColor, onChange }: ColorData) => {
  const [color, setColor] = useState(defaultColor)

  useEffect(() => {
    setColor(defaultColor)
  }, [defaultColor])

  return (
    <Popover>
      <PopoverTrigger>
        <div className="bg-background-surface border border-neutral-outline-border rounded-xl p-4 flex flex-row space-x-4 items-center cursor-pointer">
          <Card asChild>
            <div
              className="w-4 h-4 rounded-lg"
              style={{ backgroundColor: color }}
            />
          </Card>
          <Typography level="p4" fontWeight="lg">
            {color}
          </Typography>
        </div>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent asChild>
          <div className="flex w-[300px] border-none bg-transparent shadow-none ">
            <SketchPicker
              color={color}
              onChange={(color) => {
                setColor(color.hex)
                onChange(color.hex)
              }}
              width="100%"
              disableAlpha
            />
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  )
}
