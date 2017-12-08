setxkbmap us intl
xset -b
ssh-add
# wal -i "$(< "${HOME}/.cache/wal/wal")" &
sh ~/.fehbg &
compton --config ~/.config/compton/compton.conf &
udiskie &
transmission-daemon
syndaemon -d -i 0.5
telegram-desktop -startintray &
exec awesome
