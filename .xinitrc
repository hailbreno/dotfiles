setxkbmap br
sh ~/.fehbg &
dunst &
compton --config ~/.config/compton/compton.conf &
udiskie &
transmission-daemon
wal -i "$(< "${HOME}/.cache/wal/wal")" &
exec i3
