import {
  Card,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
  Typography,
} from '@mochi-ui/core'
import { useEffect, useState } from 'react'
import { SketchPicker } from 'react-color'
import { Controller, useFormContext } from 'react-hook-form'
import { type BotAppearance } from './BotAppearance'

interface ColorData {
  defaultColor: string
}

export const ColorPicker = (props: ColorData) => {
  const { control, setValue } = useFormContext<BotAppearance>()
  const [color, setColor] = useState(props.defaultColor)

  useEffect(() => {
    setColor(props.defaultColor)
  }, [props.defaultColor])

  return (
    <Controller
      name="accentColour"
      control={control}
      render={({ fieldState }) => (
        <FormControl error={!!fieldState.error} hideHelperTextOnError>
          <FormLabel>Color</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Card asChild>
                <div className="flex flex-row space-x-4 items-center cursor-pointer">
                  <Card asChild>
                    <div
                      className="`w-4 h-4 rounded-lg"
                      style={{ backgroundColor: color }}
                    />
                  </Card>
                  <Typography level="p4" fontWeight="lg">
                    {color}
                  </Typography>
                </div>
              </Card>
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverContent asChild>
                <div className="w-[300px] border-none bg-transparent shadow-none ">
                  <SketchPicker
                    color={color}
                    onChange={(color) => {
                      setColor(color.hex)
                      setValue('accentColour', color.hex, { shouldDirty: true })
                    }}
                    width="120%"
                    disableAlpha
                  />
                </div>
              </PopoverContent>
            </PopoverPortal>
          </Popover>
          <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
        </FormControl>
      )}
    />
  )
}
