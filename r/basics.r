
# x <- iris #varijabla x sadrzi ceo iris

# setosa <- iris[iris$Species == "setosa",] #setosa sadrzi svaki red vrste setosa
# versicolor <- iris[iris$Species == "versicolor",] #versicolor sadrzi svaki red vrste versicolor

# setosa
# versicolor
# nrow(versicolor) #broj redova te vrste 50
# nrow(setosa)
# nrow(iris) # br redova celog irisa 150
# ncol(iris) # broj colona 5


# t.test(x =setosa$Petal.Length , y = versicolor$Petal.Length) # uporedjivanje dve kolone dve razlicite vrste

#  Challenge 1

# Test for significant differences in petal lengths between
#  I. setosa and I. virginica and between I. versicolor and I. virginica.

#  code: 

set <-iris[iris$Species == "setosa",]
virg <- iris[iris$Species == "virginica",]
veris <- iris[iris$Species == "versicolor",]

t.test(x = set$Petal.Length, y= virg$Petal.Length)

t.test(x = veris$Petal.Length, y = virg$Petal.Length)


# aov(formula = Petal.lenght ~ Species, data = iris) # x~y ispitujemo da li je petal lenght ista u svim vrstama u dati iris
petal.lenght.aov <- aov(formula = Petal.Lenght ~ Species, data = iris)

summary(object = petal.lenght.aov)

sink(file = "output/petal-length-anova.txt")
summary(object = petal.length.aov)
sink()



# Challenge 2
# Use ANOVA to test for differences in sepal width among the three species. 
# What is the value of the F-statistic?

sepal.width.aov <- aov(formula = Sepal.Width ~ Species, data = iris)

summary(object = sepal.width.aov)

sink(file = "output/sepal-width-aov.txt")
summary(object = sepal.lenght.aov)
sink()




