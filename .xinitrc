setxkbmap br
wal -i "$(< "${HOME}/.cache/wal/wal")" &
sh ~/.fehbg &
dunst &
compton --config ~/.config/compton/compton.conf &
udiskie &
transmission-daemon
exec i3
