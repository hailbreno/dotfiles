setxkbmap br
xset -b
wal -i "$(< "${HOME}/.cache/wal/wal")" &
sh ~/.fehbg &
compton --config ~/.config/compton/compton.conf &
udiskie &
transmission-daemon
telegram-desktop -startintray &
albert &
# exec i3
exec awesome
