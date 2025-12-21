void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}
void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  Serial.println("signal:0.8,temp:36.5");
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}
