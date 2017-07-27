setxkbmap br
xset -b
wal -i "$(< "${HOME}/.cache/wal/wal")" &
sh ~/.fehbg &
compton --config ~/.config/compton/compton.conf &
udiskie &
transmission-daemon
# exec i3
exec awesome
