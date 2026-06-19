import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { TeamFlag } from "@/components/TeamFlag"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Team } from "@workspace/api-client-react"

interface TeamComboboxProps {
  teams: Team[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function TeamCombobox({ teams, value, onChange, placeholder = "Select team...", disabled }: TeamComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedTeam = teams.find((team) => team.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-14 text-lg bg-card border-border hover:bg-accent hover:text-accent-foreground"
          disabled={disabled}
        >
          {selectedTeam ? (
            <div className="flex items-center gap-3 truncate">
              <TeamFlag flagCode={selectedTeam.flagCode} size={28} />
              <span className="font-semibold">{selectedTeam.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 border-border bg-card">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search team..." className="h-11" />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup>
              {teams.map((team) => (
                <CommandItem
                  key={team.id}
                  value={team.name}
                  onSelect={() => {
                    onChange(team.id)
                    setOpen(false)
                  }}
                  className="flex items-center gap-3 py-3 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 text-primary",
                      value === team.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <TeamFlag flagCode={team.flagCode} size={28} />
                  <div className="flex flex-col flex-1 truncate">
                    <span className="font-medium text-foreground">{team.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Group {team.group} • FIFA Rank: {team.fifaRanking}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
