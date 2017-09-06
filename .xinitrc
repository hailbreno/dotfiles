setxkbmap br
xset -b
ssh-add
# wal -i "$(< "${HOME}/.cache/wal/wal")" &
sh ~/.fehbg &
compton --config ~/.config/compton/compton.conf &
udiskie &
transmission-daemon
telegram-desktop -startintray &
exec awesome
