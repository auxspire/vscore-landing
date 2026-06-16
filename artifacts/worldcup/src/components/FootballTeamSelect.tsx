import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn, getFlagEmoji } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FootballTeam } from "@/hooks/useFootballData";

interface FootballTeamSelectProps {
  teams: FootballTeam[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FootballTeamSelect({
  teams,
  value,
  onChange,
  placeholder = "Select a team…",
}: FootballTeamSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = teams.find((t) => t.api_team_id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full h-12 justify-between bg-secondary/30 border-border text-left font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              {selected.fifa_code ? (
                <span className="text-xl leading-none shrink-0">{getFlagEmoji(selected.fifa_code)}</span>
              ) : null}
              <span className="truncate font-medium">{selected.name_en}</span>
              {selected.group_name ? (
                <span className="text-xs text-muted-foreground shrink-0">Group {selected.group_name}</span>
              ) : null}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[min(70vh,24rem)] z-[100]"
        align="start"
        sideOffset={4}
      >
        <Command className="bg-transparent">
          <CommandInput placeholder="Search team…" className="h-11" />
          <CommandList className="max-h-[min(60vh,20rem)]">
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup>
              {teams.map((team) => (
                <CommandItem
                  key={team.api_team_id}
                  value={`${team.name_en} ${team.group_name ?? ""}`}
                  onSelect={() => {
                    onChange(team.api_team_id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 py-2.5 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 text-primary",
                      value === team.api_team_id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {team.fifa_code ? (
                    <span className="text-xl leading-none shrink-0">{getFlagEmoji(team.fifa_code)}</span>
                  ) : null}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium truncate">{team.name_en}</span>
                    {team.group_name ? (
                      <span className="text-xs text-muted-foreground">Group {team.group_name}</span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
