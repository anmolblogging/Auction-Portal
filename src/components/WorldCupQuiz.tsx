'use client';
import { useState } from 'react';
import type { CSSProperties } from 'react';

interface Question {
  q: string;
  opts: string[];
  a: string;
}

const QUIZ_DATA: Record<string, Question[]> = {
  'General World Cup': [
    { q: "Who won the very first FIFA World Cup in 1930?", opts: ["Brazil", "Argentina", "Uruguay", "Italy"], a: "Uruguay" },
    { q: "Which player holds the record for the most goals in World Cup history?", opts: ["Pele", "Miroslav Klose", "Ronaldo", "Lionel Messi"], a: "Miroslav Klose" },
    { q: "Which country has won the most World Cup titles?", opts: ["Germany", "Italy", "Brazil", "Argentina"], a: "Brazil" },
    { q: "Who holds the record for most goals in a single World Cup tournament?", opts: ["Just Fontaine", "Gerd Muller", "Sandor Kocsis", "Kylian Mbappe"], a: "Just Fontaine" },
    { q: "Which country hosted the 2010 FIFA World Cup?", opts: ["Brazil", "Germany", "South Africa", "Russia"], a: "South Africa" },
    { q: "What was the name of the original World Cup trophy?", opts: ["FIFA Cup", "Jules Rimet Trophy", "Global Cup", "Champion's Gold"], a: "Jules Rimet Trophy" },
    { q: "Who is the oldest player to score in a World Cup?", opts: ["Roger Milla", "Pele", "Cristiano Ronaldo", "Maradona"], a: "Roger Milla" },
    { q: "Which nation has reached the most World Cup finals without ever winning?", opts: ["Netherlands", "Hungary", "Sweden", "Croatia"], a: "Netherlands" },
    { q: "Who won the Golden Ball at the 2018 World Cup?", opts: ["Luka Modric", "Harry Kane", "Kylian Mbappe", "Antoine Griezmann"], a: "Luka Modric" },
    { q: "Which player scored the infamous 'Hand of God' goal?", opts: ["Pele", "Diego Maradona", "Lionel Messi", "Thierry Henry"], a: "Diego Maradona" },
    { q: "Which two countries co-hosted the 2002 World Cup?", opts: ["USA & Mexico", "France & Germany", "Japan & South Korea", "Spain & Portugal"], a: "Japan & South Korea" },
    { q: "Who is the only player to win three World Cups?", opts: ["Cafu", "Pele", "Ronaldo", "Maradona"], a: "Pele" },
    { q: "What animal was the mascot for the 1966 World Cup in England?", opts: ["Dog", "Lion", "Bear", "Bulldog"], a: "Lion" },
    { q: "Which country won the World Cup in 1998?", opts: ["Brazil", "Italy", "France", "Germany"], a: "France" },
    { q: "Who holds the record for the fastest goal in World Cup history (11 seconds)?", opts: ["Hakan Sukur", "Hakan Calhanoglu", "Clint Dempsey", "Pele"], a: "Hakan Sukur" },
    { q: "Which host nation was eliminated in the group stage of the 2010 World Cup?", opts: ["South Africa", "Japan", "Russia", "Qatar"], a: "South Africa" },
    { q: "How many teams participated in the 2022 World Cup?", opts: ["24", "32", "48", "16"], a: "32" },
    { q: "Which player won the Best Young Player award in 2018?", opts: ["Kylian Mbappe", "Marcus Rashford", "Vinicius Jr", "Jude Bellingham"], a: "Kylian Mbappe" },
    { q: "Which African nation was the first to reach a World Cup quarter-final?", opts: ["Nigeria", "Ghana", "Cameroon", "Senegal"], a: "Cameroon" },
    { q: "Which team did Italy defeat in the 2006 World Cup final?", opts: ["Germany", "Brazil", "France", "Argentina"], a: "France" },
    { q: "What year did the USA host the FIFA World Cup?", opts: ["1990", "1994", "1998", "2002"], a: "1994" }
  ],
  'Argentina': [
    { q: "In what year did Argentina win their first World Cup?", opts: ["1978", "1982", "1986", "1990"], a: "1978" },
    { q: "Who was Argentina's top scorer in the 1978 World Cup?", opts: ["Diego Maradona", "Mario Kempes", "Daniel Passarella", "Gabriel Batistuta"], a: "Mario Kempes" },
    { q: "Which team did Argentina defeat in the 1986 World Cup final?", opts: ["Italy", "West Germany", "Brazil", "England"], a: "West Germany" },
    { q: "How many World Cup goals did Diego Maradona score in his career?", opts: ["6", "8", "10", "12"], a: "8" },
    { q: "Who managed Argentina to their 2022 World Cup victory?", opts: ["Alejandro Sabella", "Diego Simeone", "Lionel Scaloni", "Jorge Sampaoli"], a: "Lionel Scaloni" },
    { q: "How many total World Cup goals has Lionel Messi scored?", opts: ["11", "13", "15", "16"], a: "13" },
    { q: "Against which country did Messi score his first-ever World Cup goal in 2006?", opts: ["Serbia and Montenegro", "Ivory Coast", "Mexico", "Netherlands"], a: "Serbia and Montenegro" },
    { q: "Who scored Argentina's winning penalty in the 2022 World Cup final?", opts: ["Lionel Messi", "Paulo Dybala", "Gonzalo Montiel", "Leandro Paredes"], a: "Gonzalo Montiel" },
    { q: "Which goalkeeper won the Golden Glove in 2022?", opts: ["Sergio Romero", "Franco Armani", "Emiliano Martinez", "Willy Caballero"], a: "Emiliano Martinez" },
    { q: "Who did Argentina lose to in the 2014 World Cup final?", opts: ["Netherlands", "Brazil", "France", "Germany"], a: "Germany" },
    { q: "How many World Cup tournaments has Lionel Messi played in?", opts: ["3", "4", "5", "6"], a: "5" },
    { q: "Who scored Argentina's Goal of the Tournament in 2006 with a 24-pass move?", opts: ["Hernan Crespo", "Esteban Cambiasso", "Maxi Rodriguez", "Juan Riquelme"], a: "Esteban Cambiasso" },
    { q: "Which player wore the number 10 shirt for Argentina in the 1998 World Cup?", opts: ["Ariel Ortega", "Gabriel Batistuta", "Diego Maradona", "Juan Sebastian Veron"], a: "Ariel Ortega" },
    { q: "Against which team did Argentina suffer a shock 2-1 defeat in their opening 2022 match?", opts: ["Mexico", "Saudi Arabia", "Poland", "Australia"], a: "Saudi Arabia" },
    { q: "Who is Argentina's second-highest goalscorer in World Cup history?", opts: ["Diego Maradona", "Mario Kempes", "Gabriel Batistuta", "Gonzalo Higuain"], a: "Gabriel Batistuta" },
    { q: "Which player assisted Jorge Burruchaga for the winning goal in the 1986 final?", opts: ["Jorge Valdano", "Diego Maradona", "Oscar Ruggeri", "Nery Pumpido"], a: "Diego Maradona" },
    { q: "In what year did Argentina host the World Cup?", opts: ["1970", "1974", "1978", "1982"], a: "1978" },
    { q: "Who was sent off for Argentina against England in the 1998 World Cup?", opts: ["Diego Simeone", "Javier Zanetti", "Ariel Ortega", "David Beckham"], a: "Diego Simeone" },
    { q: "Which Argentine player won the Best Young Player award at the 2022 World Cup?", opts: ["Julian Alvarez", "Enzo Fernandez", "Lisandro Martinez", "Alexis Mac Allister"], a: "Enzo Fernandez" },
    { q: "Who scored Argentina's second goal against France in the 2022 final?", opts: ["Angel Di Maria", "Lionel Messi", "Julian Alvarez", "Rodrigo De Paul"], a: "Angel Di Maria" },
    { q: "What is the nickname of the Argentine national football team?", opts: ["La Roja", "La Albiceleste", "Los Pumas", "El Tri"], a: "La Albiceleste" }
  ],
  'Brazil': [
    { q: "How many World Cup titles has Brazil won?", opts: ["3", "4", "5", "6"], a: "5" },
    { q: "Who is the only player in history to win three World Cups?", opts: ["Ronaldo", "Cafu", "Pele", "Romario"], a: "Pele" },
    { q: "In what year did Brazil win their first World Cup?", opts: ["1950", "1954", "1958", "1962"], a: "1958" },
    { q: "Which team did Brazil defeat in the 2002 World Cup final?", opts: ["France", "Germany", "Italy", "Spain"], a: "Germany" },
    { q: "Who scored both goals in the 2002 World Cup final?", opts: ["Rivaldo", "Ronaldinho", "Ronaldo", "Kaka"], a: "Ronaldo" },
    { q: "Which Brazilian holds the record for most World Cup appearances (matches played) for the country?", opts: ["Cafu", "Roberto Carlos", "Pele", "Ronaldo"], a: "Cafu" },
    { q: "Which country hosted the 1950 World Cup, where Brazil famously lost the final match?", opts: ["Uruguay", "Argentina", "Brazil", "Chile"], a: "Brazil" },
    { q: "Who was the captain of Brazil's 1970 World Cup-winning team?", opts: ["Pele", "Carlos Alberto", "Jairzinho", "Gerson"], a: "Carlos Alberto" },
    { q: "Which Brazilian player won the Golden Ball at the 1994 World Cup?", opts: ["Bebeto", "Romario", "Dunga", "Ronaldo"], a: "Romario" },
    { q: "Who famously missed a penalty for Italy in the 1994 final against Brazil?", opts: ["Roberto Baggio", "Paolo Maldini", "Franco Baresi", "Demetrio Albertini"], a: "Roberto Baggio" },
    { q: "Which team handed Brazil their historic 7-1 defeat in 2014?", opts: ["Argentina", "Netherlands", "Germany", "France"], a: "Germany" },
    { q: "Who was Brazil's top scorer in the 2014 World Cup before getting injured?", opts: ["Fred", "Oscar", "Neymar", "Hulk"], a: "Neymar" },
    { q: "What was the official name of the 2014 World Cup match ball used in Brazil?", opts: ["Jabulani", "Brazuca", "Telstar", "Tango"], a: "Brazuca" },
    { q: "Which Brazilian defender scored a famous free-kick against China in 2002?", opts: ["Cafu", "Lucio", "Roberto Carlos", "Aldair"], a: "Roberto Carlos" },
    { q: "Who scored the iconic 4th goal for Brazil in the 1970 World Cup final?", opts: ["Pele", "Jairzinho", "Gerson", "Carlos Alberto"], a: "Carlos Alberto" },
    { q: "How many goals did Ronaldo score in World Cup tournaments overall?", opts: ["12", "14", "15", "16"], a: "15" },
    { q: "Who managed Brazil to their 2002 World Cup victory?", opts: ["Mario Zagallo", "Carlos Alberto Parreira", "Luiz Felipe Scolari", "Tite"], a: "Luiz Felipe Scolari" },
    { q: "Which Brazilian player was nicknamed 'The Phenomenon'?", opts: ["Pele", "Ronaldinho", "Ronaldo", "Neymar"], a: "Ronaldo" },
    { q: "In 1962, who stepped up as Brazil's main star after Pele was injured?", opts: ["Garrincha", "Didi", "Vava", "Zito"], a: "Garrincha" },
    { q: "Against which team did Neymar score his first-ever World Cup goal?", opts: ["Croatia", "Cameroon", "Mexico", "Colombia"], a: "Croatia" },
    { q: "Which Brazilian goalkeeper saved a penalty in the 1998 semi-final shootout against Netherlands?", opts: ["Dida", "Julio Cesar", "Marcos", "Taffarel"], a: "Taffarel" }
  ],
  'France': [
    { q: "In what year did France win their first World Cup?", opts: ["1982", "1986", "1998", "2006"], a: "1998" },
    { q: "Who scored two headers in the 1998 World Cup final?", opts: ["Thierry Henry", "Zinedine Zidane", "Emmanuel Petit", "Laurent Blanc"], a: "Zinedine Zidane" },
    { q: "Which team did France defeat in the 2018 World Cup final?", opts: ["Belgium", "England", "Croatia", "Argentina"], a: "Croatia" },
    { q: "Who was the manager of the French team for their 2018 World Cup win?", opts: ["Aime Jacquet", "Laurent Blanc", "Didier Deschamps", "Zinedine Zidane"], a: "Didier Deschamps" },
    { q: "How many goals did Kylian Mbappe score in the 2022 World Cup?", opts: ["6", "7", "8", "9"], a: "8" },
    { q: "Who holds the record for most goals in a single World Cup (13 goals for France)?", opts: ["Thierry Henry", "Just Fontaine", "Michel Platini", "Olivier Giroud"], a: "Just Fontaine" },
    { q: "Which French player was sent off in the 2006 World Cup final?", opts: ["Thierry Henry", "Patrick Vieira", "Zinedine Zidane", "Claude Makelele"], a: "Zinedine Zidane" },
    { q: "Who won the Best Young Player award at the 2018 World Cup?", opts: ["Ousmane Dembele", "Kylian Mbappe", "Kingsley Coman", "Benjamin Pavard"], a: "Kylian Mbappe" },
    { q: "What is the nickname of the French national team?", opts: ["Les Bleus", "La Furia Roja", "Die Mannschaft", "Azzurri"], a: "Les Bleus" },
    { q: "Which player scored the winning golden goal for France against Paraguay in 1998?", opts: ["Lilian Thuram", "Laurent Blanc", "David Trezeguet", "Thierry Henry"], a: "Laurent Blanc" },
    { q: "Who is France's all-time top scorer in World Cup history?", opts: ["Thierry Henry", "Kylian Mbappe", "Just Fontaine", "Olivier Giroud"], a: "Just Fontaine" },
    { q: "Which team eliminated France in the 2014 World Cup quarter-finals?", opts: ["Brazil", "Germany", "Argentina", "Colombia"], a: "Germany" },
    { q: "Who scored an incredible long-range volley for France against Argentina in 2018?", opts: ["Paul Pogba", "N'Golo Kante", "Benjamin Pavard", "Kylian Mbappe"], a: "Benjamin Pavard" },
    { q: "Which French player missed their penalty in the 2006 World Cup final shootout?", opts: ["David Trezeguet", "Sylvain Wiltord", "Fabien Barthez", "Eric Abidal"], a: "David Trezeguet" },
    { q: "In 2010, which team infamously went on strike during the World Cup in South Africa?", opts: ["Italy", "Spain", "France", "England"], a: "France" },
    { q: "Who was the captain of the French team during the 2018 and 2022 World Cups?", opts: ["Raphael Varane", "Hugo Lloris", "Paul Pogba", "Antoine Griezmann"], a: "Hugo Lloris" },
    { q: "How many World Cup finals has France appeared in total?", opts: ["2", "3", "4", "5"], a: "4" },
    { q: "Which French midfielder won Man of the Match in the 2018 World Cup Final?", opts: ["Paul Pogba", "N'Golo Kante", "Blaise Matuidi", "Antoine Griezmann"], a: "Antoine Griezmann" },
    { q: "Who scored France's 4th goal in the 2018 World Cup final?", opts: ["Kylian Mbappe", "Paul Pogba", "Antoine Griezmann", "Olivier Giroud"], a: "Kylian Mbappe" },
    { q: "Which French striker famously failed to score a single goal during their 2018 World Cup win?", opts: ["Antoine Griezmann", "Kylian Mbappe", "Olivier Giroud", "Ousmane Dembele"], a: "Olivier Giroud" }
  ],
  'Germany': [
    { q: "How many World Cup titles has Germany won?", opts: ["2", "3", "4", "5"], a: "4" },
    { q: "Who scored the winning goal in the 2014 World Cup final?", opts: ["Thomas Muller", "Mario Gotze", "Miroslav Klose", "Bastian Schweinsteiger"], a: "Mario Gotze" },
    { q: "Which player holds the all-time record for most World Cup goals?", opts: ["Gerd Muller", "Miroslav Klose", "Jurgen Klinsmann", "Thomas Muller"], a: "Miroslav Klose" },
    { q: "Who captained West Germany to victory in the 1990 World Cup?", opts: ["Franz Beckenbauer", "Karl-Heinz Rummenigge", "Lothar Matthaus", "Rudi Voller"], a: "Lothar Matthaus" },
    { q: "Which country did Germany famously defeat 7-1 in 2014?", opts: ["Argentina", "France", "Brazil", "Italy"], a: "Brazil" },
    { q: "Who was the manager of Germany during their 2014 World Cup win?", opts: ["Jurgen Klinsmann", "Joachim Low", "Rudi Voller", "Franz Beckenbauer"], a: "Joachim Low" },
    { q: "Which German player won the Golden Glove award at the 2014 World Cup?", opts: ["Oliver Kahn", "Jens Lehmann", "Manuel Neuer", "Marc-Andre ter Stegen"], a: "Manuel Neuer" },
    { q: "In what year did West Germany win the 'Miracle of Bern'?", opts: ["1954", "1974", "1990", "1966"], a: "1954" },
    { q: "Who did Germany beat in the 1974 World Cup final?", opts: ["Brazil", "Italy", "Netherlands", "Argentina"], a: "Netherlands" },
    { q: "Which German player won the Golden Boot at the 2010 World Cup?", opts: ["Miroslav Klose", "Lukas Podolski", "Thomas Muller", "Bastian Schweinsteiger"], a: "Thomas Muller" },
    { q: "Which player has made the most World Cup appearances (25) for Germany?", opts: ["Lothar Matthaus", "Miroslav Klose", "Philipp Lahm", "Bastian Schweinsteiger"], a: "Lothar Matthaus" },
    { q: "Who scored Germany's only goal in the 2002 World Cup final?", opts: ["Michael Ballack", "Oliver Bierhoff", "Miroslav Klose", "No one (They lost 2-0)"], a: "No one (They lost 2-0)" },
    { q: "Which team eliminated Germany in the group stages of the 2018 World Cup?", opts: ["Sweden", "South Korea", "Mexico", "Serbia"], a: "South Korea" },
    { q: "Who was the German goalkeeper that won the Golden Ball (Best Player) in 2002?", opts: ["Andreas Kopke", "Jens Lehmann", "Oliver Kahn", "Manuel Neuer"], a: "Oliver Kahn" },
    { q: "How many goals did Gerd Muller score in World Cup tournaments?", opts: ["10", "12", "14", "16"], a: "14" },
    { q: "Which German player scored a hat-trick against Portugal in the 2014 opening match?", opts: ["Thomas Muller", "Mario Gotze", "Toni Kroos", "Mesut Ozil"], a: "Thomas Muller" },
    { q: "Who is the only person to win the World Cup as captain and manager for Germany?", opts: ["Berti Vogts", "Jurgen Klinsmann", "Franz Beckenbauer", "Joachim Low"], a: "Franz Beckenbauer" },
    { q: "Which team knocked Germany out of the 2022 World Cup group stage?", opts: ["Japan", "Spain", "Costa Rica", "Belgium"], a: "Japan" },
    { q: "Who scored two goals within 69 seconds during the 7-1 win over Brazil?", opts: ["Thomas Muller", "Toni Kroos", "Andre Schurrle", "Sami Khedira"], a: "Toni Kroos" },
    { q: "What is the official nickname of the German national team?", opts: ["Die Mannschaft", "La Roja", "Azzurri", "The Eagles"], a: "Die Mannschaft" },
    { q: "In 2006, Germany hosted the World Cup. Who knocked them out in the semi-finals?", opts: ["France", "Portugal", "Italy", "Argentina"], a: "Italy" }
  ],
  'England': [
    { q: "In what year did England win their only World Cup?", opts: ["1958", "1966", "1970", "1982"], a: "1966" },
    { q: "Who scored a hat-trick for England in the 1966 World Cup final?", opts: ["Bobby Charlton", "Geoff Hurst", "Martin Peters", "Gary Lineker"], a: "Geoff Hurst" },
    { q: "Which player won the Golden Boot at the 1986 World Cup?", opts: ["Gary Lineker", "Alan Shearer", "Bryan Robson", "Bobby Charlton"], a: "Gary Lineker" },
    { q: "Who managed the England team during the 2018 and 2022 World Cups?", opts: ["Roy Hodgson", "Sam Allardyce", "Gareth Southgate", "Fabio Capello"], a: "Gareth Southgate" },
    { q: "Which team knocked England out of the 2022 World Cup?", opts: ["Brazil", "France", "Croatia", "Argentina"], a: "France" },
    { q: "Who won the Golden Boot for England at the 2018 World Cup?", opts: ["Raheem Sterling", "Marcus Rashford", "Harry Kane", "Wayne Rooney"], a: "Harry Kane" },
    { q: "Against which country did Diego Maradona score the 'Hand of God' goal in 1986?", opts: ["West Germany", "Italy", "England", "Brazil"], a: "England" },
    { q: "Which England player famously cried after receiving a yellow card in the 1990 semi-final?", opts: ["Stuart Pearce", "Paul Gascoigne", "Gary Lineker", "Chris Waddle"], a: "Paul Gascoigne" },
    { q: "Who missed the decisive penalty for England in the 1998 shootout against Argentina?", opts: ["Paul Ince", "David Beckham", "David Batty", "Alan Shearer"], a: "David Batty" },
    { q: "Which England player was sent off against Argentina in 1998?", opts: ["Paul Scholes", "Wayne Rooney", "David Beckham", "Michael Owen"], a: "David Beckham" },
    { q: "Who scored England's famous free-kick goal against Colombia in 1998?", opts: ["David Beckham", "Darren Anderton", "Alan Shearer", "Michael Owen"], a: "David Beckham" },
    { q: "Which young England striker scored a stunning solo goal against Argentina in 1998?", opts: ["Wayne Rooney", "Robbie Fowler", "Michael Owen", "Emile Heskey"], a: "Michael Owen" },
    { q: "What animal features on the crest of the England national team?", opts: ["Lion", "Eagle", "Bulldog", "Dragon"], a: "Lion" },
    { q: "Who scored a controversial 'ghost goal' against Germany in 2010 that wasn't given?", opts: ["Wayne Rooney", "Steven Gerrard", "Frank Lampard", "Joe Cole"], a: "Frank Lampard" },
    { q: "Which England player scored a penalty against Argentina in 2002 to redeem himself?", opts: ["Michael Owen", "David Beckham", "Steven Gerrard", "Paul Scholes"], a: "David Beckham" },
    { q: "Who was England's captain during the 2010 World Cup?", opts: ["Steven Gerrard", "John Terry", "Rio Ferdinand", "Wayne Rooney"], a: "Steven Gerrard" },
    { q: "Which team defeated England in the 2018 World Cup semi-finals?", opts: ["Belgium", "France", "Croatia", "Colombia"], a: "Croatia" },
    { q: "How many World Cup goals did Wayne Rooney score in his entire career?", opts: ["1", "3", "5", "7"], a: "1" },
    { q: "Which stadium hosted the 1966 World Cup final?", opts: ["Old Trafford", "Anfield", "Wembley", "Highbury"], a: "Wembley" },
    { q: "Who scored England's opening goal of the 2022 World Cup against Iran?", opts: ["Jude Bellingham", "Bukayo Saka", "Harry Kane", "Raheem Sterling"], a: "Jude Bellingham" },
    { q: "Who was the England goalkeeper in the 1966 World Cup winning team?", opts: ["Peter Shilton", "Gordon Banks", "Ray Clemence", "David Seaman"], a: "Gordon Banks" }
  ],
  'Spain': [
    { q: "In what year did Spain win their first and only World Cup?", opts: ["2006", "2010", "2014", "2018"], a: "2010" },
    { q: "Who scored the winning goal in the 2010 World Cup final?", opts: ["David Villa", "Fernando Torres", "Andres Iniesta", "Xavi Hernandez"], a: "Andres Iniesta" },
    { q: "Which team did Spain defeat in the 2010 World Cup final?", opts: ["Germany", "Brazil", "Netherlands", "Argentina"], a: "Netherlands" },
    { q: "Who was Spain's top scorer in the 2010 World Cup with 5 goals?", opts: ["Andres Iniesta", "Fernando Torres", "David Villa", "Pedro"], a: "David Villa" },
    { q: "Which goalkeeper captained Spain to their 2010 victory?", opts: ["David de Gea", "Pepe Reina", "Iker Casillas", "Victor Valdes"], a: "Iker Casillas" },
    { q: "Who managed Spain during their 2010 World Cup triumph?", opts: ["Luis Aragones", "Vicente del Bosque", "Julen Lopetegui", "Fernando Hierro"], a: "Vicente del Bosque" },
    { q: "Which country hosted the 1982 World Cup?", opts: ["Mexico", "Italy", "Spain", "France"], a: "Spain" },
    { q: "Which team famously defeated Spain 5-1 in the 2014 World Cup group stage?", opts: ["Chile", "Netherlands", "Australia", "Brazil"], a: "Netherlands" },
    { q: "What famous tactical style is associated with Spain's 2010 team?", opts: ["Catenaccio", "Gegenpressing", "Tiki-Taka", "Total Football"], a: "Tiki-Taka" },
    { q: "Which team eliminated Spain on penalties in the 2022 World Cup?", opts: ["Russia", "Morocco", "Croatia", "Switzerland"], a: "Morocco" },
    { q: "Which team eliminated Spain on penalties in the 2018 World Cup?", opts: ["Russia", "Morocco", "Croatia", "Switzerland"], a: "Russia" },
    { q: "Who scored Spain's only goal in their 2010 semi-final win against Germany?", opts: ["Sergio Ramos", "Gerard Pique", "Carles Puyol", "Xabi Alonso"], a: "Carles Puyol" },
    { q: "Which player wore the number 8 shirt for Spain in 2010?", opts: ["Xavi", "Iniesta", "Fabregas", "Silva"], a: "Xavi" },
    { q: "Which Spanish player famously kissed reporter Sara Carbonero on live TV after winning the 2010 final?", opts: ["Sergio Ramos", "Iker Casillas", "Gerard Pique", "Cesc Fabregas"], a: "Iker Casillas" },
    { q: "Against which team did Spain lose their opening match of the 2010 World Cup?", opts: ["Honduras", "Chile", "Switzerland", "Paraguay"], a: "Switzerland" },
    { q: "Who assisted Andres Iniesta's winning goal in the 2010 final?", opts: ["Jesus Navas", "Cesc Fabregas", "Fernando Torres", "Xavi"], a: "Cesc Fabregas" },
    { q: "Which Spanish defender missed a penalty against Morocco in 2022?", opts: ["Aymeric Laporte", "Rodri", "Cesar Azpilicueta", "Pablo Sarabia"], a: "Rodri" },
    { q: "Who was Spain's youngest player to score in a World Cup (until 2022)?", opts: ["Raul", "Fernando Torres", "Cesc Fabregas", "Gavi"], a: "Raul" },
    { q: "Which team did Spain beat 7-0 in the 2022 World Cup group stage?", opts: ["Japan", "Germany", "Costa Rica", "Iran"], a: "Costa Rica" },
    { q: "What is the nickname of the Spanish national team?", opts: ["La Albiceleste", "La Furia Roja", "El Tri", "Azzurri"], a: "La Furia Roja" },
    { q: "Which Spanish player won the Best Young Player award at the 2006 World Cup?", opts: ["Fernando Torres", "Sergio Ramos", "Cesc Fabregas", "Andres Iniesta"], a: "Cesc Fabregas" }
  ],
  'Portugal': [
    { q: "What is Portugal's best-ever finish at a FIFA World Cup?", opts: ["Winners", "Runners-up", "3rd Place", "4th Place"], a: "3rd Place" },
    { q: "In what year did Portugal achieve their best World Cup finish?", opts: ["1966", "1986", "2006", "2018"], a: "1966" },
    { q: "Who was the top scorer of the 1966 World Cup with 9 goals?", opts: ["Pele", "Geoff Hurst", "Eusebio", "Jose Torres"], a: "Eusebio" },
    { q: "How many World Cup goals has Cristiano Ronaldo scored?", opts: ["6", "7", "8", "9"], a: "8" },
    { q: "In how many different World Cup tournaments has Cristiano Ronaldo scored?", opts: ["3", "4", "5", "6"], a: "5" },
    { q: "Which team eliminated Portugal in the 2022 World Cup quarter-finals?", opts: ["Spain", "France", "Morocco", "Argentina"], a: "Morocco" },
    { q: "Who scored a hat-trick for Portugal against Switzerland in the 2022 Round of 16?", opts: ["Cristiano Ronaldo", "Joao Felix", "Bruno Fernandes", "Goncalo Ramos"], a: "Goncalo Ramos" },
    { q: "Against which team did Cristiano Ronaldo score a famous hat-trick in the 2018 World Cup?", opts: ["Spain", "Iran", "Morocco", "Uruguay"], a: "Spain" },
    { q: "Who managed Portugal during their 2022 World Cup campaign?", opts: ["Jose Mourinho", "Luiz Felipe Scolari", "Fernando Santos", "Roberto Martinez"], a: "Fernando Santos" },
    { q: "Which team defeated Portugal in the 2006 World Cup semi-finals?", opts: ["Germany", "Italy", "France", "Brazil"], a: "France" },
    { q: "Who was the manager of Portugal during their run to the 2006 semi-finals?", opts: ["Carlos Queiroz", "Fernando Santos", "Luiz Felipe Scolari", "Jose Mourinho"], a: "Luiz Felipe Scolari" },
    { q: "Which Portuguese player famously winked after Wayne Rooney was sent off in 2006?", opts: ["Luis Figo", "Deco", "Ricardo Carvalho", "Cristiano Ronaldo"], a: "Cristiano Ronaldo" },
    { q: "Against which country did Cristiano Ronaldo score his first-ever World Cup goal in 2006?", opts: ["Angola", "Mexico", "Iran", "Netherlands"], a: "Iran" },
    { q: "In the infamous 'Battle of Nuremberg' in 2006, how many red cards were shown in Portugal vs Netherlands?", opts: ["2", "3", "4", "5"], a: "4" },
    { q: "Who is Portugal's second-highest scorer in World Cup history?", opts: ["Pauleta", "Luis Figo", "Eusebio", "Cristiano Ronaldo"], a: "Cristiano Ronaldo" },
    { q: "Which Portuguese goalkeeper famously saved three penalties against England in 2006?", opts: ["Rui Patricio", "Vitor Baia", "Eduardo", "Ricardo"], a: "Ricardo" },
    { q: "Which team eliminated Portugal in the Round of 16 at the 2010 World Cup?", opts: ["Brazil", "Spain", "Germany", "Argentina"], a: "Spain" },
    { q: "Who scored Portugal's opening goal in the 2022 World Cup against Ghana?", opts: ["Cristiano Ronaldo", "Joao Felix", "Rafael Leao", "Bruno Fernandes"], a: "Cristiano Ronaldo" },
    { q: "Which former Ballon d'Or winner captained Portugal in the 2006 World Cup?", opts: ["Eusebio", "Rui Costa", "Deco", "Luis Figo"], a: "Luis Figo" },
    { q: "What is the nickname of the Portuguese national team?", opts: ["A Selecao", "Os Navegadores", "The Dragons", "La Roja"], a: "A Selecao" }
  ],
  'Netherlands': [
    { q: "How many times have the Netherlands lost in a World Cup final?", opts: ["1", "2", "3", "4"], a: "3" },
    { q: "Who scored the famous 'flying Dutchman' diving header against Spain in 2014?", opts: ["Arjen Robben", "Robin van Persie", "Wesley Sneijder", "Memphis Depay"], a: "Robin van Persie" },
    { q: "Which legendary Dutch manager is credited with inventing 'Total Football'?", opts: ["Johan Cruyff", "Louis van Gaal", "Rinus Michels", "Guus Hiddink"], a: "Rinus Michels" },
    { q: "In what year did the Netherlands first reach a World Cup final?", opts: ["1970", "1974", "1978", "1982"], a: "1974" },
    { q: "Which Dutch player scored a spectacular 90th-minute winner against Argentina in the 1998 quarter-finals?", opts: ["Patrick Kluivert", "Edgar Davids", "Dennis Bergkamp", "Frank de Boer"], a: "Dennis Bergkamp" },
    { q: "Who won the Silver Ball as the tournament's second-best player in 2010?", opts: ["Arjen Robben", "Wesley Sneijder", "Robin van Persie", "Mark van Bommel"], a: "Wesley Sneijder" },
    { q: "Which Dutch goalkeeper was famously substituted on specifically for the penalty shootout against Costa Rica in 2014?", opts: ["Jasper Cillessen", "Maarten Stekelenburg", "Tim Krul", "Edwin van der Sar"], a: "Tim Krul" },
    { q: "Which team defeated the Netherlands in the 2010 World Cup final?", opts: ["Germany", "Brazil", "Spain", "France"], a: "Spain" },
    { q: "Who missed a crucial 1-on-1 breakaway chance against Iker Casillas in the 2010 final?", opts: ["Wesley Sneijder", "Robin van Persie", "Dirk Kuyt", "Arjen Robben"], a: "Arjen Robben" },
    { q: "Which team eliminated the Netherlands on penalties in the 2022 World Cup quarter-finals?", opts: ["Brazil", "Croatia", "Argentina", "France"], a: "Argentina" },
    { q: "Who scored two late goals against Argentina in 2022 to force extra time?", opts: ["Cody Gakpo", "Wout Weghorst", "Wout Weghorst", "Memphis Depay"], a: "Wout Weghorst" },
    { q: "Which player captained the Netherlands to the 2010 World Cup final?", opts: ["Giovanni van Bronckhorst", "Mark van Bommel", "Wesley Sneijder", "Robin van Persie"], a: "Giovanni van Bronckhorst" },
    { q: "Who scored the fastest goal in the 1974 World Cup final before West Germany even touched the ball?", opts: ["Johan Cruyff", "Johan Neeskens", "Ruud Krol", "Johnny Rep"], a: "Johan Neeskens" },
    { q: "What is the traditional color of the Netherlands national team jersey?", opts: ["Red", "Blue", "Orange", "White"], a: "Orange" }
  ],
  'Belgium': [
    { q: "What is Belgium's highest ever finish at a FIFA World Cup?", opts: ["Winners", "Runners-up", "3rd Place", "4th Place"], a: "3rd Place" },
    { q: "In what year did Belgium achieve their best-ever World Cup finish?", opts: ["1986", "2014", "2018", "2022"], a: "2018" },
    { q: "Who is Belgium's all-time top scorer in World Cup history?", opts: ["Eden Hazard", "Romelu Lukaku", "Kevin De Bruyne", "Marc Wilmots"], a: "Romelu Lukaku" },
    { q: "Who managed the Belgian 'Golden Generation' to a Bronze medal in 2018?", opts: ["Marc Wilmots", "Roberto Martinez", "Domenico Tedesco", "Georges Leekens"], a: "Roberto Martinez" },
    { q: "Which team did Belgium defeat 2-0 to secure 3rd place in 2018?", opts: ["Croatia", "England", "Brazil", "Uruguay"], a: "England" },
    { q: "Who scored the 94th-minute winner completing a 3-2 comeback against Japan in 2018?", opts: ["Kevin De Bruyne", "Eden Hazard", "Marouane Fellaini", "Nacer Chadli"], a: "Nacer Chadli" },
    { q: "Which Belgian player won the Silver Ball as the 2nd best player of the 2018 World Cup?", opts: ["Kevin De Bruyne", "Eden Hazard", "Thibaut Courtois", "Romelu Lukaku"], a: "Eden Hazard" },
    { q: "Which goalkeeper won the Golden Glove award in 2018?", opts: ["Simon Mignolet", "Koen Casteels", "Thibaut Courtois", "Jean-Marie Pfaff"], a: "Thibaut Courtois" },
    { q: "Which legendary Argentine scored twice to knock Belgium out of the 1986 semi-finals?", opts: ["Jorge Valdano", "Diego Maradona", "Gabriel Batistuta", "Mario Kempes"], a: "Diego Maradona" },
    { q: "Who eliminated Belgium from the 2014 World Cup quarter-finals?", opts: ["Argentina", "Brazil", "Germany", "Netherlands"], a: "Argentina" },
    { q: "What is the nickname of the Belgian national football team?", opts: ["The Red Dragons", "The Red Devils", "The Lions", "The Golden Boys"], a: "The Red Devils" }
  ],
  'Croatia': [
    { q: "In what year did Croatia reach their first-ever World Cup final?", opts: ["1998", "2014", "2018", "2022"], a: "2018" },
    { q: "Who won the Golden Boot as the top scorer of the 1998 World Cup?", opts: ["Gabriel Batistuta", "Ronaldo", "Davor Suker", "Zvonimir Boban"], a: "Davor Suker" },
    { q: "Which Croatian player won the Golden Ball for Best Player at the 2018 World Cup?", opts: ["Ivan Rakitic", "Luka Modric", "Mario Mandzukic", "Ivan Perisic"], a: "Luka Modric" },
    { q: "Who scored the extra-time winning goal against England in the 2018 semi-final?", opts: ["Ivan Perisic", "Ante Rebic", "Luka Modric", "Mario Mandzukic"], a: "Mario Mandzukic" },
    { q: "Which team defeated Croatia 4-2 in the 2018 World Cup Final?", opts: ["Brazil", "Germany", "France", "Argentina"], a: "France" },
    { q: "Which Croatian goalkeeper saved three penalties against Japan in the 2022 Round of 16?", opts: ["Danijel Subasic", "Dominik Livakovic", "Stipe Pletikosa", "Lovre Kalinic"], a: "Dominik Livakovic" },
    { q: "Who has been the manager of the Croatian national team since 2017?", opts: ["Niko Kovac", "Igor Tudor", "Zlatko Dalic", "Slaven Bilic"], a: "Zlatko Dalic" },
    { q: "In 1998, Croatia defeated which football powerhouse 3-0 in the quarter-finals?", opts: ["Brazil", "Germany", "Italy", "Argentina"], a: "Germany" },
    { q: "Which team did Croatia beat to secure 3rd place in the 2022 World Cup?", opts: ["Morocco", "Netherlands", "England", "Portugal"], a: "Morocco" },
    { q: "Who scored Croatia's opening goal in the 2018 World Cup final?", opts: ["Mario Mandzukic", "Ivan Perisic", "Luka Modric", "Domagoj Vida"], a: "Ivan Perisic" },
    { q: "What distinct pattern is always featured on Croatia's primary jersey?", opts: ["Stripes", "Polka Dots", "Red and White Checkers", "Solid Red"], a: "Red and White Checkers" }
  ],
  'Sweden': [
    { q: "In what year did Sweden host the FIFA World Cup?", opts: ["1950", "1954", "1958", "1962"], a: "1958" },
    { q: "What is Sweden's highest-ever finish in a World Cup?", opts: ["Winners", "Runners-up", "3rd Place", "4th Place"], a: "Runners-up" },
    { q: "Which team defeated Sweden 5-2 in the 1958 World Cup Final?", opts: ["West Germany", "Argentina", "Italy", "Brazil"], a: "Brazil" },
    { q: "In 1994, Sweden finished 3rd. Which dreadlocked striker scored 5 goals for them?", opts: ["Martin Dahlin", "Tomas Brolin", "Henrik Larsson", "Kennet Andersson"], a: "Henrik Larsson" },
    { q: "How many World Cup goals has Zlatan Ibrahimovic scored?", opts: ["0", "2", "4", "6"], a: "0" },
    { q: "Which country eliminated Sweden in the quarter-finals of the 2018 World Cup?", opts: ["Germany", "England", "Croatia", "France"], a: "England" },
    { q: "Which Swedish player won the Silver Shoe at the 1994 World Cup?", opts: ["Tomas Brolin", "Henrik Larsson", "Martin Dahlin", "Kennet Andersson"], a: "Kennet Andersson" },
    { q: "Against which team did Sweden famously draw 2-2 in 2006 thanks to a late Henrik Larsson goal?", opts: ["England", "Paraguay", "Trinidad and Tobago", "Germany"], a: "England" },
    { q: "Sweden failed to qualify for the 2022 World Cup after losing a playoff to which nation?", opts: ["Portugal", "Poland", "Italy", "Macedonia"], a: "Poland" }
  ],
  'Scotland': [
    { q: "Which Scottish player scored one of the greatest World Cup goals ever against the Netherlands in 1978?", opts: ["Kenny Dalglish", "Denis Law", "Archie Gemmill", "Joe Jordan"], a: "Archie Gemmill" },
    { q: "How many times has Scotland advanced past the first round of the World Cup?", opts: ["Zero", "Once", "Twice", "Three Times"], a: "Zero" },
    { q: "What is the famous nickname of the Scotland national team's supporters?", opts: ["The Highlanders", "The Tartan Army", "The Bravehearts", "The Thistles"], a: "The Tartan Army" },
    { q: "In what year did Scotland make their last appearance at a FIFA World Cup?", opts: ["1990", "1994", "1998", "2002"], a: "1998" },
    { q: "Who was the manager of Scotland during their infamous 1978 World Cup campaign?", opts: ["Jock Stein", "Alex Ferguson", "Ally MacLeod", "Craig Brown"], a: "Ally MacLeod" },
    { q: "Which team did Scotland draw 0-0 with in the 1974 World Cup?", opts: ["Brazil", "Zaire", "Yugoslavia", "West Germany"], a: "Brazil" },
    { q: "Which legendary Manchester United manager briefly managed Scotland at the 1986 World Cup?", opts: ["Matt Busby", "Bill Shankly", "Alex Ferguson", "Tommy Docherty"], a: "Alex Ferguson" },
    { q: "Scotland opened the 1998 World Cup playing against which defending champion?", opts: ["Germany", "Italy", "Argentina", "Brazil"], a: "Brazil" }
  ],
  'Norway': [
    { q: "Norway famously defeated which defending World Cup champion 2-1 in the 1998 group stage?", opts: ["Germany", "Brazil", "Italy", "Argentina"], a: "Brazil" },
    { q: "Who scored the dramatic 89th-minute winning penalty for Norway in that 1998 match?", opts: ["Tore Andre Flo", "Ole Gunnar Solskjaer", "Kjetil Rekdal", "John Carew"], a: "Kjetil Rekdal" },
    { q: "How many times has Norway qualified for the FIFA World Cup?", opts: ["Twice", "Three times", "Four times", "Five times"], a: "Three times" },
    { q: "In what year did Norway make their very first World Cup appearance?", opts: ["1938", "1954", "1982", "1994"], a: "1938" },
    { q: "Who was the manager of Norway during their successful runs in 1994 and 1998?", opts: ["Egil Olsen", "Age Hareide", "Nils Johan Semb", "Stale Solbakken"], a: "Egil Olsen" },
    { q: "In 1994, Norway was eliminated in the group stage despite having the same points as every other team. How many points did they have?", opts: ["2", "3", "4", "5"], a: "4" },
    { q: "Which team knocked Norway out in the Round of 16 at the 1998 World Cup?", opts: ["France", "Italy", "Germany", "Argentina"], a: "Italy" },
    { q: "Tore Andre Flo scored how many goals for Norway in the 1998 World Cup?", opts: ["1", "2", "3", "4"], a: "1" }
  ]
};

const overlayStyle: CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,7,14,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 };
const modalStyle: CSSProperties = { width: '100%', maxWidth: 540, background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--bd2)', padding: 32, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', animation: 'fadeUp 0.3s ease' };

export default function WorldCupQuiz({ category, onClose }: { category: string, onClose: () => void }) {
  const safeCategory = QUIZ_DATA[category] ? category : 'General World Cup';
  const questions = QUIZ_DATA[safeCategory];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[currentIndex];

  const handleSelect = (opt: string) => {
    if (isAnswered) return;
    setSelectedOpt(opt);
    setIsAnswered(true);
    if (opt === currentQ.a) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div style={overlayStyle}>
        <div style={{ ...modalStyle, textAlign: 'center', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: 2, color: 'var(--t1)', margin: 0 }}>
            {safeCategory} <span style={{ color: 'var(--g)' }}>COMPLETED</span>
          </h2>
          <div style={{ margin: '20px 0', position: 'relative', width: 140, height: 140, borderRadius: '50%', background: 'var(--bg2)', border: `8px solid ${percentage >= 70 ? 'var(--g)' : percentage >= 40 ? 'var(--am)' : 'var(--re)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: 'var(--t1)' }}>{score}/{questions.length}</span>
          </div>
          <p style={{ color: 'var(--t2)', fontSize: 16 }}>
            {percentage >= 80 ? "Incredible knowledge! You're a football historian." : percentage >= 50 ? "Solid effort! You know your stuff." : "Keep watching the beautiful game!"}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, width: '100%' }}>
            <button className="btn bs" onClick={onClose} style={{ flex: 1 }}>Close Quiz</button>
            <button className="btn bp" onClick={() => { setCurrentIndex(0); setScore(0); setSelectedOpt(null); setIsAnswered(false); setIsFinished(false); }} style={{ flex: 1 }}>Play Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bd2)', paddingBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1.5, margin: 0 }}>{safeCategory}</h3>
            <div style={{ fontSize: 12, color: 'var(--t3)', fontFamily: "'Rajdhani', sans-serif", marginTop: 4, fontWeight: 600 }}>Question {currentIndex + 1} of {questions.length}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${((currentIndex) / questions.length) * 100}%`, height: '100%', background: 'var(--g)', transition: 'width 0.3s ease' }} />
        </div>

        <h4 style={{ fontSize: 18, color: 'var(--t1)', lineHeight: 1.5, margin: '10px 0' }}>{currentQ.q}</h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {currentQ.opts.map((opt, i) => {
            let bg = 'var(--bg2)';
            let borderColor = 'var(--bd2)';
            let color = 'var(--t2)';

            if (isAnswered) {
              if (opt === currentQ.a) {
                bg = 'rgba(0,220,114,0.1)';
                borderColor = 'var(--g)';
                color = 'var(--g)';
              } else if (opt === selectedOpt) {
                bg = 'rgba(239,68,68,0.1)';
                borderColor = 'var(--re)';
                color = 'var(--re)';
              }
            } else if (opt === selectedOpt) {
              bg = 'var(--bg3)';
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(opt)}
                disabled={isAnswered}
                style={{
                  padding: '14px 18px',
                  background: bg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 8,
                  color: color,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "'Rajdhani', sans-serif",
                  textAlign: 'left',
                  cursor: isAnswered ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, minHeight: 44 }}>
          {isAnswered ? (
            <span style={{ fontSize: 14, fontWeight: 'bold', color: selectedOpt === currentQ.a ? 'var(--g)' : 'var(--re)' }}>
              {selectedOpt === currentQ.a ? '✓ Correct!' : '✕ Incorrect'}
            </span>
          ) : <span />}

          <button 
            className="btn bp" 
            onClick={handleNext} 
            disabled={!isAnswered}
            style={{ opacity: isAnswered ? 1 : 0, pointerEvents: isAnswered ? 'auto' : 'none' }}
          >
            {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question →'}
          </button>
        </div>
      </div>
    </div>
  );
}