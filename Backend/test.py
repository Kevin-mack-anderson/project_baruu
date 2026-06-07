import pyttsx3

print("Menyalakan mesin suaara")
mesin = pyttsx3.init()
mesin.say("Hello bima, ini tes dari suara python")
mesin.runAndWait()
print("selesai bicara")