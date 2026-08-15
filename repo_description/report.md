# ProjetoEW - Mapa Virtual das Ruas de Braga - 2024

# Autores

#### Equipa: ENAMETOOLONG

- **Diogo Alexandre Correia Marques - a100897** 
- **Ivan Sérgio Rocha Ribeiro - a100538**
- **Pedro Miguel Meruge Ferreira - a100709**


*******

- [Processamento de dados](#Processamento_de_dados)
- [Docker](#Docker)
- [Importação e exportação de dados](#Importacao_e_exportacao_de_dados)
- [Autenticação](#Autenticacao)
- [Rotas](#Rotas)
- [Páginas do website](#Paginas_do_website)

*******

<div id="Processamento_de_dados"/>

# Processamento de dados

Inicialmente, desenvolvemos o script `validateXml.py` que verifica se os dados (`.xml`) têm a estrutura correta (`.xsd`)

Verificamos que existiam tags e atributos nos sítios incorretos/que não deviam existir. Por exemplo:

- A tag `<vista>` aparecia na 2ª posição (incorretamente), dentro do elemento `<casa>`. Foi movida para o fim do elemento `<casa>`.
- O atributo `"entidade"` dentro da tag `<entidade>` não existia. Foi substituído para o atributo correto `"tipo"`

De seguida desenvolvemos o script `convXMLtoJSON.py`, que transforma os dados `xml` em `json`:

- Fizemos a conversão inicial de XML para JSON, com recurso à biblioteca lxml, guardando, para cada rua: os lugares, entidades e datas encontrados nas tags dos parágrafos de descrição da respetiva rua.
- De seguida, percorremos todos os jsons de ruas obtidos e criamos dicionários de todos os lugares, entidades e datas encontrados nas várias ruas, e associamos um ID único a cada um.
- Depois, substituímos nas várias ruas os lugares, entidades e datas pelo seu ID.
- Exportamos as ruas, entidades, lugares e datas para ficheiros json diferentes, de modo a serem facilmente importados para coleções diferentes no mongodb.

[//]: # (acham relevante isto vvvv ?)
Separamos entidades, lugares e datas em coleções diferentes por serem conceitos independentes que várias ruas referenciam e, tendo em vista a expansão da plataforma no futuro, desta forma reduzimos o tempo de queries de procurar ruas por entidade/lugar/data e facilitamos a expansão dos conceitos de lugar/entidade/data no futuro.

[//]: # (acaba aqui o parágrafo a que me refiro)

Ao tentar fazer a ligação com as imagens de cada rua, surgiram novas dificuldades devido à desformatação dos nomes. Assim, tivemos de os corrigir manualmente, e decidimos passar a relacionar ruas e as suas imagens através de um ID e não do nome.

Como seria necessário importar as imagens de forma a gerar o seu ID, acabamos por fazer com que o script `convXMLtoJSON.py`, ao invés de exportar os novos dados, os carregue diretamente para as diferentes coleções no mongodb.

Devido ao tamanho inconsistente das imagens, utilizámos o script `padding.sh` para lhes colocar padding.

Para popular as coordenadas geográficas de cada rua (utilizadas nos mapas do site), utilizámos o script `getStreetsGeoCords.py`que recorre à Geocoding API do MapBox.


Por fim, as coleções geradas no processamento do dataset foram:
```
antigo   - imagens antigas
atual    - imagens atuais
dates    - datas mencionadas nas ruas
entities - entidades mencionadas nas ruas
places   - lugares mencionadas nas ruas
streets  - dados sobre cada rua
```

Adcionalmente, para suportar as restantes funcionalidades do site, criamos também outras coleções:
```
comments - comentários sobre ruas
users    - utilizadores
```

### Coleções
Em maior detalhe, as coleções têm os seguintes formatos:

- **antigo/atual**

O nome da imagem será, implicitamente, igual ao seu `_id`, pelo que guardamos a extensão de modo a conseguir obter o nome completo do ficheiro respetivo
```
subst: String - descrição da imagem
extension: String - extensão da imagem
```

- **dates/entities/places**
```
name: String - nome da data/entidade/lugar
ruas: [String] - IDs das ruas onde a data/entidade/lugar aparece
```

- **streets**
```
name: String - nome da rua
owner: String - ID do utilizador que registou a rua
favorites: [String] - IDs dos utilizadores que gostam da rua
description: [String] - texto descritivo da história da rua
dates: [String] - IDs das datas referenciadas pela rua
places: [String] - IDs dos lugares referenciados pela rua
entities: [String] - IDs das entidades referenciadas pela rua
houses: [String] - IDs das casas que aparecem na rua
old_images: [ObjectId] - IDs das imagens antigas da rua
new_images: [ObjectId] - IDs das imagens atuais da rua
geoCords: {
  longitude: String - longitude geográfica da rua
  latitude: String - latitude geográfica da rua
}
```

- **comments**
```
streetId: String - ID da rua sobre a qual se comenta
baseCommentId: String - ID de comentário a que se está a responder (se for o caso)
owner: String - ID do utilizador que registou o comentário
text: String - conteúdo do comentário
createdAt: Date - data de criação do comentário
updatedAt: Date - data de edição do conteúdo do comentário
likes: [String] - IDs de utilizadores que gostaram do comentário
dislikes: [String] - IDs de utilizadores que desgostaram do comentário
```

- **users**
```
username: String - nome de login do utilizador
password: String - hash base64 da password
name: String - nome do utilizador dentro do site
level: 'ADMIN' | 'USER' - nível de privilégio
active: Boolean - utilizador ativo ou não
dateCreated: String - data de criação da conta
```

*******

<div id="Docker"/>

# Docker:

Criamos dois _docker compose_. Um deles usa o script de python para converter os XML e povoar a base de dados, como mencionado anteriormente, colocando também as imagens no serviço de dados:
```bash
sudo ./docker_setup.sh
```

O outro inicia o serviço de dados e o frontend em si, aproveitando o container de mongodb já povoado pelo script anterior:
```bash
sudo ./docker_servico.sh
```

> **_NOTA:_**  Enquanto medida de segunça, os *containers* `mongodb` e `serviço de dados` não exteriorizam as suas portas, apenas o `frontend` está exposto.

*******

<div id="Importacao_e_exportacao_de_dados"/>

# Importação e exportação de dados

No serviço de dados, utilizam-se os scripts `import.sh` e `export.sh` para importar e exportar os dados. Estes são executados pelo próprio serviço de dados, através das rotas descritas em [Rotas](#Rotas).

Estas duas rotas são depois utilizadas pelo frontend, estando as funcionalidades disponíveis apenas a administradores.

O ficheiro de exportação, `dados.tar`, tem os seguintes conteúdos:

```bash
dados.tar
├── files.tar.xz
│   ├── antigo                            -> imagens antigas
│   │   ├── 666cc1f7ac573c823263d94e.jpg
│   │   ├── 666cc1f7ac573c823263da38.jpg
│   │   └── ...
│   ├── antigo.json                       -> collection exportada
│   ├── atual                             -> imagens atuais
│   │   ├── 666cc1f7ac573c823263d950.JPG
│   │   ├── 666cc1f7ac573c823263da3a.JPG
│   │   └── ...
│   ├── atual.json                        -> outra collection
│   ├── comments.json
│   ├── dates.json
│   ├── entities.json
│   ├── places.json
│   ├── streets.json
│   └── users.json
└── manifest.json                         -> manifesto
```

O manifesto tem o formato:
```js
{
  "meta": {
    "size": 37768137 // tamanho em bytes dos ficheiros
  },
  "dados": { // todas as coleções exportadas
    "streets": {
      "collection": "streets",
      "filename": "streets.json",
      "records": 60
    },
    "dates": {
      "collection": "dates",
      "filename": "dates.json",
      "records": 265
    },
    "entities": {
      "collection": "entities",
      "filename": "entities.json",
      "records": 913
    },
    "places": {
      "collection": "places",
      "filename": "places.json",
      "records": 587
    },
    "antigo": {
      "collection": "antigo",
      "filename": "antigo.json",
      "records": 116
    },
    "atual": {
      "collection": "atual",
      "filename": "atual.json",
      "records": 121
    },
    "comments": {
      "collection": "comments",
      "filename": "comments.json",
      "records": 0
    },
    "users": {
      "collection": "users",
      "filename": "users.json",
      "records": 3
    }
  }
}
```

Ao importar, consideramos apenas as coleções mencionadas no manifesto, verificando também:
- se o número de records corresponde ao indicado
- se o ficheiro de dados existe
- se uma coleção de imagens for indicada, verificamos se todas as imagens mencionadas existem

*******

<div id="Autenticacao"/>

# Autenticação

Apesar de existirem servidores dedicados única e exclusivamente à auntenticação de utilizadores, consideramos que tal estratégia seria desnecessária, além de envolver necessariamente mais trocas de mensagens entre serviços e consequente aumento do tempo de resposta sentido pelo utilizador. 

Assim sendo, o `serviço de dados` garante a autenticação de utilizadores e a manutenção do estado de sessão, sendo que para tal são combinados os *middlewares* do *Passport* e *JSON Web Tokens*.

## Passport

Testa a validade das credencias de acesso, sendo que para tal usufrui da estratégia `local`. Além disso não guarda as *passwords* diretamente na base de dados, mas sim o código de *hash* resultante e *salt* utilizado para randomizar.  

## JSON Web Tokens

Para manter o estado de sessão é gerado um *token* com a validade de 1 hora. Este é sucessivamente trocado entre o *browser* e a aplicação em todos os pedidos realizados, garantindo assim que apenas utilizadores autenticados recebem respostas corretas.

Durante a criação de um *token*, o *ID* e nível de acesso do utilizador são inseridos no *payload*, desta forma, mais tarde, é possível verificar se um dado pedido tem privilégios suficientes para aceder a um determinado recurso.

Por fim, para efetuar *logout*, uma vez que não é possível remover *tokens* do *browser*, a estratégia utilizada envolve tornar o *token* inválido, alterando assim a sua data de expiração para o momento atual.

## Login

![login](https://github.com/pedromeruge/ProjetoEW/assets/87565693/46dddf94-ec79-4775-94b8-4430b50488cc)

## Obter Recursos

![get](https://github.com/pedromeruge/ProjetoEW/assets/87565693/d1169146-d6b9-4e58-9ddc-1ab21bfc5955)

*******

<div id="Rotas"/>

# Rotas

## Frontend

**Comentários**
- POST
  - `/comentarios/:id` - submeter edição de comentário pré-existente 
- PUT
  - `/comentarios/:id/gostos` - gostar de comentário 
  - `/comentarios/:id/desgostos` - desgostar de comentário
- DELETE
  - `/comentarios/:id` - apagar comentário

**Datas/Entidades/Lugares**
- GET
  - `/datas` - página de listagem de datas
  - `/entidades` - página de listagem de entidades
  - `/lugares` - página de listagem de lugares

**Imagens**
- GET
  - `/:folder/:id` - obter da pasta "antigo" ou "atual" uma imagem

**Index**
- GET
  - `/` - página inicial após login
  - `/logout` - logout do utilizador
  - `/importar` - enviar ficheiro com dados da BD a ser importados
  - `/exportar` - receber ficheiro com dados da BD

**Login**
- GET
  - `/login` - página de login do utilizador
- POST
  - `/login` - submeter login do utilizador

**Ruas**
- GET
  - `/ruas` - página de listagem de ruas
  - `/ruas/eliminar/:id` - apagar rua criada
  - `/ruas/registar` - página de criar rua
  - `/ruas/editar/:id` - página de edição de rua
  - `/ruas/:id` - página de apresentação de rua
- POST
  - `/ruas/registar` - submeter registo de utilizador
  - `/ruas/editar/:id` - submeter edição de rua
  - `/ruas/:id/comentarios` - submeter comentário em rua 
  - `/ruas/:streetId/comentarios/:commentId/respostas` - submeter resposta a comentário em rua
  - `/ruas/favorito/:id` - submeter rua como favorita
- DELETE
  - `/ruas/favorito/:id` - eliminar rua como favorito

**Utilizadores**
- GET
  - `/utilizadores/:id` - página de perfil de utilizador

## Backend

**Imagens antigas**
- GET
	- `/antigo` - lista de dados sobre imagens antigas
	- `/antigo/:id` - dados sobre uma imagem antiga com este id
	- `/antigo/show/:id` - a imagem em si, podendo ser mostrada no browser
- POST
	- `/antigo` - submeter uma nova imagem
- PUT
	- `/antigo/:id` - alterar dados da imagem, exceto o ficheiro da imagem em si
- DELETE
	- `/antigo/:id` - apagar imagem

**Imagens atuais**

- Exatamente igual ao anterior, exceto usando `atual` em vez de `antigo`

**Comentários**

- GET
	- `/comentarios` - lista de comentários
	- `/comentarios/:id` - dados do comentário com este id
	- `/comentarios/ruas/:id` - todos os comentários sobre a rua com este id
- POST
	- `/comentarios` - criar um novo comentário
	- `/comentarios/:id/respostas` - criar um novo comentário como resposta ao deste id 
- PUT
	- `/comentarios/:id/gostos` - adicionar gosto (e remover desgosto) ao comentário com este id
	- `/comentarios/:id/desgostos` - adicionar desgosto (e remover gosto) ao comentário com este id
	- `/comentarios/:id` - editar um comentário
- DELETE
	- `/comentarios/:id` - remover comentário

**Ruas**

- GET
	- `/ruas` - lista de ruas
	- `/ruas/:id` - dados de uma rua
- POST
	- `/ruas` - criar uma nova rua
	- `/ruas/favorito/:id` - adicionar favorito a uma rua
- PUT
	- `/ruas/:id` - editar uma rua
- DELETE
	- `/ruas/:id` - apagar uma rua
	- `/ruas/favorito/:id` - remover favorito de uma rua

**Datas**

- GET
	- `/datas` - lista de datas
	- `/datas/:id` - dados de uma data
- POST
	- `/datas` - adicionar uma data
- PUT
	- `/datas/:id` - editar uma data
- DELETE
	- `/datas/:id` - apagar uma data

**Lugares**

- GET
	- `/lugares` - lista de lugares
	- `/lugares/:id` - dados de um lugar
- POST
	- `/lugares` - adicionar um lugar
- PUT
	- `/lugares/:id` - editar um lugar
- DELETE
	- `/lugares/:id` - apagar um lugar

**Utilizadores**
- GET
	- `/users` - lista de utilizadores
	- `/users/:id` - dados de um utilizador
- POST
	- `/users/register` - regista um novo utilizador
	- `/users/login` - efetuar login de um utilizador

**Importar/Exportar**
- GET
	- `/impexp/exportar` - download de um ficheiro com os dados exportados
- POST
	- `/impexp/importar` - upload de um ficheiro com dados a serem importados

*******

<div id="Paginas_do_website"/>

# Páginas do website

## Registar/Login

Quando estabelecemos uma ligação ao `frontend` somos imediatamente encaminhados para a página de *login*, contudo se tivermos previamente uma sessão aberta tal não acontece e obtemos a página pretendida.

No caso das credenciais de autenticaçãos estarem incorretas é fornecido um pequeno *feedback*, sendo que nas situações de perda da palavra-passe é necessário criar um novo registo.

Um utilizador que ainda não tenha credenciais no sistema pode registar-se na secção "registar"

https://github.com/pedromeruge/ProjetoEW/assets/87565693/7a984b73-f47f-4e60-b1a2-9db0d51aa19b

## Página principal

A página padrão para a qual o utilizador é redirecionado após login/register. 

Inclui botões que redirecionam para a listagem de ruas, datas, entidades ou lugares. Inclui também botões para fazer "logout" ou aceder ao perfil do utilizador. No caso dos admins, há também acesso aos botões de importar e exportar conteúdos da BD.

## Índice de ruas
Inclui uma listagem das várias ruas inseridas no sistema. Cada elemento da lista redireciona para a página da respetiva rua. No topo da página existe um mapa de Braga com um marcador interativo para cada uma das ruas inseridas no sistema. Por baixo, surge uma barra de pesquisa que permite filtrar as ruas por nome.

## Índices de datas/entidades/lugares

Os registos das ruas mencionam várias datas, entidades e lugares, pelo que foram desenvolvidos índices para permitir obter uma listagem completa das ruas visadas por cada um.

Os índices são todos semelhantes, ou seja, utilizam *collapsibles* para esconder/apresentar os nomes das ruas, que por sua vez são um *link* para a página da própria rua. 


Existe também uma barra de pesquisa para filtrar as entradas da lista por nome.

https://github.com/pedromeruge/ProjetoEW/assets/87565693/60893740-6722-41ac-bb30-8af8f2ae3498

## Apresentação de rua

Apresenta todos os dados relativos a uma rua. O primeiro elemento da página é um *slideshow* que apresenta as imagens antigas e atuais da rua, sendo que para cada uma é fornecida uma breve legenda.

De seguida estão posicionados alguns botões que permitem:

- Retroceder
- Editar
- Eliminar
- Adicionar aos favoritos
- Apresentar as datas/entidades/lugares

Convém destacar que os botões de edição e eliminação apenas estão acessíveis aos administradores do sistema e ao utilizador que registou a rua. 

De seguida, é fornecida uma breve descrição da rua e tabela das famílias residentes. No fim existe um mapa do posicionamento geográfico da rua e uma secção de discussão onde utilizadores podem escrever comentários e interagir.

https://github.com/pedromeruge/ProjetoEW/assets/87565693/2465b94f-cc55-4f6c-850d-5892d6f552d5

## Registo de rua

Os registo das ruas pode ser efetuado por qualquer utilizador, efetuado através de um formulário dividido em cinco zonas:

- **Informações:** identificação do nome da rua e descrição da mesma.
- **Datas/Entidades/Lugares:** parâmetros referenciados pela ruas.
- **Casas:** caracterização das casas e famílias residentes na rua.
- **Fotografias:** imagens antigas e atuais da rua, bem como uma legenda sobre cada uma.
- **Localização:** coordenadas geográficas da rua

Em algumas das zonas apresentadas não é possível prever quantos campos o utilizador irá preencher, como tal foram adicionados botões que permitem adicionar/remover campos do formulário.

Para facilitar a introdução das coordendas geográficas da rua, existe uma secção de pesquisa automática que comunica com a Geocoding API do Mapbox.

https://github.com/pedromeruge/ProjetoEW/assets/87565693/820c5d61-37a6-493f-b38f-35b82444b486

## Edição de rua

Para alterar o registo de uma rua é possível reutilizar o formulário utilizado durante o seu registo, sendo que desta vez os campos estão preenchidos com os valores atuais.

Desta forma as funcionalidades de adicionar/remover campos estão novamente presentes, e além disso é possível visualizar as imagens da rua através de um *modal*.

Posto isto, após efetuar as alterações pretendidas é necessário clicar no botão `Atualizar`, sendo que para cancelar tudo basta clicar em `Voltar`.

https://github.com/pedromeruge/ProjetoEW/assets/87565693/928b25c8-02a7-46af-aa10-6ec963cbfa6d

## Página de utilizador

Nesta página o utilizador tem acesso aos seus dados pessoais: o seu username, nome e nível de acesso (admin ou não). Para além disso, são indicados todos os registos de ruas que o utilizador publicou, todas as ruas que marcou como favorito, bem como todos os comentários que já publicou. Clicando em qualquer um deles, o utilizador é redirecionado para a respetiva página.

# Funcionalidades do website

## Favoritos

Para adicionar uma rua aos favoritos basta clicar na estrela posicionada no início da respetiva página da rua, sendo que a partir daí o botão fica preenchido, e para remover basta clicar novamente. 

O utilizador pode depois consultar no seu perfil as ruas favoritas.

## Comentários

Em relação aos comentários, estão disponíveis várias funcionalidades:

- Publicar comentário
- Responder a outro utilizador.
- Alterar o texto de comentário.
- Eliminar (remove as respostas encadeadas).
- Gostar/desgostar de comentário

Os comentários são mostrados encadeados relativamente à resposta anterior, usando uma linha vertical para permitir facilmente visualizar a sua origem. Um utilizador autor de comentário pode editá-lo ou apagá-lo. Um administrador (não autor) apenas pode apagá-lo.

https://github.com/pedromeruge/ProjetoEW/assets/87565693/738f1713-d0f1-42df-bbe9-e5a948f35fb2

## Importação e exportação

Como referido antes, estas funcionalidades estão expostas na página prinicipal, apenas acessíveis aos administradores, bastando clicar no botão `Dados`, onde se podem escolher as duas opções:

- **Importar:** o *browser* abre o selecionador de ficheiros, permitindo escolher um ficheiro `.tar`. De seguida é apresentada uma barra de progresso até que os dados tenham sido todos importados, finalmente sendo o utilizador informado acerca do sucesso (ou não) da operação.  
- **Exportar:** o *browser* inicia automaticamente o *download* do ficheiro `dados.tar`, contendo todos os dados presentes no _backend_.

https://github.com/pedromeruge/ProjetoEW/assets/87565693/972265ba-d509-4f0f-9696-6738f94eaf78

## Mapas

Com recurso ao Mapbox, apresentamos mapas da localização das ruas. Na página de listagem de ruas, ao clicar num marcador de rua, o mapa é centrado nessa rua, e revela um popup no qual o utilizador pode clicar para ser redirecionado para a respetiva página.

Existem botões de rodar, ampliar e desampliar para facilitar a navegação. Existem modelos 3D simplificados dos edifícios quando o utilizador amplia significativamente. O utilizador pode escolher entre diferentes estilos de mapa e clicar em "Câmara lateral" para obter uma perspetiva lateral das ruas. 
