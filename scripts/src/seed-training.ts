import { db } from "@workspace/db";
import { trainingExercisesTable } from "@workspace/db";

const exercises = [
  // Fundamentos
  { title: "FizzBuzz", platform: "leetcode", platformId: "412", url: "https://leetcode.com/problems/fizz-buzz/", category: "Fundamentos", difficulty: "easy", description: "Clássico problema de lógica: imprima FizzBuzz para múltiplos de 3 e 5.", tags: ["loops", "condicionais"] },
  { title: "Palíndromo", platform: "leetcode", platformId: "9", url: "https://leetcode.com/problems/palindrome-number/", category: "Fundamentos", difficulty: "easy", description: "Verifique se um número é palíndromo sem converter para string.", tags: ["matemática", "lógica"] },
  { title: "Número de Fibonacci", platform: "leetcode", platformId: "509", url: "https://leetcode.com/problems/fibonacci-number/", category: "Recursão", difficulty: "easy", description: "Compute o n-ésimo número de Fibonacci.", tags: ["recursão", "dp"] },
  { title: "Fatorial", platform: "beecrowd", platformId: "1012", url: "https://www.beecrowd.com.br/judge/pt/problems/view/1012", category: "Fundamentos", difficulty: "easy", description: "Calcule o fatorial de um número.", tags: ["recursão", "matemática"] },

  // Arrays
  { title: "Two Sum", platform: "leetcode", platformId: "1", url: "https://leetcode.com/problems/two-sum/", category: "Arrays", difficulty: "easy", description: "Encontre dois índices cujos valores somam ao alvo.", tags: ["hash map", "busca"] },
  { title: "Melhor Momento de Compra e Venda", platform: "leetcode", platformId: "121", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", category: "Arrays", difficulty: "easy", description: "Maximize o lucro comprando e vendendo uma ação uma vez.", tags: ["greedy", "arrays"] },
  { title: "Contém Duplicata", platform: "leetcode", platformId: "217", url: "https://leetcode.com/problems/contains-duplicate/", category: "Arrays", difficulty: "easy", description: "Verifique se algum valor aparece pelo menos duas vezes.", tags: ["hash set", "arrays"] },
  { title: "Mover Zeros", platform: "leetcode", platformId: "283", url: "https://leetcode.com/problems/move-zeroes/", category: "Arrays", difficulty: "easy", description: "Mova todos os zeros para o final mantendo a ordem relativa.", tags: ["dois ponteiros", "in-place"] },
  { title: "Produto de Array Exceto Si Mesmo", platform: "leetcode", platformId: "238", url: "https://leetcode.com/problems/product-of-array-except-self/", category: "Arrays", difficulty: "medium", description: "Retorne array onde cada elemento é produto de todos exceto ele mesmo.", tags: ["prefix sum", "arrays"] },
  { title: "Subarray de Soma Máxima (Kadane)", platform: "leetcode", platformId: "53", url: "https://leetcode.com/problems/maximum-subarray/", category: "Arrays", difficulty: "medium", description: "Encontre o subarray contíguo com a maior soma.", tags: ["dp", "greedy"] },
  { title: "3Sum", platform: "leetcode", platformId: "15", url: "https://leetcode.com/problems/3sum/", category: "Arrays", difficulty: "medium", description: "Encontre todos os triplos únicos que somam zero.", tags: ["dois ponteiros", "ordenação"] },
  { title: "Container with Most Water", platform: "leetcode", platformId: "11", url: "https://leetcode.com/problems/container-with-most-water/", category: "Arrays", difficulty: "medium", description: "Encontre o container que pode conter mais água.", tags: ["dois ponteiros", "greedy"] },

  // Strings
  { title: "Anagrama Válido", platform: "leetcode", platformId: "242", url: "https://leetcode.com/problems/valid-anagram/", category: "Strings", difficulty: "easy", description: "Determine se duas strings são anagramas entre si.", tags: ["hash map", "strings"] },
  { title: "Primeira Letra Única", platform: "leetcode", platformId: "387", url: "https://leetcode.com/problems/first-unique-character-in-a-string/", category: "Strings", difficulty: "easy", description: "Encontre o índice da primeira letra que não se repete.", tags: ["hash map", "strings"] },
  { title: "Inverter String", platform: "leetcode", platformId: "344", url: "https://leetcode.com/problems/reverse-string/", category: "Strings", difficulty: "easy", description: "Inverta um array de caracteres in-place.", tags: ["dois ponteiros", "strings"] },
  { title: "Maior Substring Sem Repetição", platform: "leetcode", platformId: "3", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", category: "Strings", difficulty: "medium", description: "Encontre o comprimento da maior substring sem caracteres repetidos.", tags: ["sliding window", "hash map"] },
  { title: "Grupos de Anagramas", platform: "leetcode", platformId: "49", url: "https://leetcode.com/problems/group-anagrams/", category: "Strings", difficulty: "medium", description: "Agrupe strings que são anagramas entre si.", tags: ["hash map", "ordenação"] },

  // Algoritmos de Ordenação
  { title: "Ordenação por Bolha", platform: "beecrowd", platformId: "1025", url: "https://www.beecrowd.com.br/judge/pt/problems/view/1025", category: "Algoritmos de Ordenação", difficulty: "easy", description: "Implemente bubble sort e ordene um array.", tags: ["sorting", "implementação"] },
  { title: "Merge Sorted Arrays", platform: "leetcode", platformId: "88", url: "https://leetcode.com/problems/merge-sorted-array/", category: "Algoritmos de Ordenação", difficulty: "easy", description: "Mescle dois arrays ordenados em um único array ordenado.", tags: ["merge sort", "dois ponteiros"] },
  { title: "Encontrar K-ésimo Maior Elemento", platform: "leetcode", platformId: "215", url: "https://leetcode.com/problems/kth-largest-element-in-an-array/", category: "Algoritmos de Ordenação", difficulty: "medium", description: "Encontre o k-ésimo maior elemento em um array.", tags: ["quickselect", "heap"] },
  { title: "Ordenar Cores (Dutch Flag)", platform: "leetcode", platformId: "75", url: "https://leetcode.com/problems/sort-colors/", category: "Algoritmos de Ordenação", difficulty: "medium", description: "Ordene um array de 0s, 1s e 2s in-place.", tags: ["dois ponteiros", "Dutch flag"] },

  // Estruturas de Dados
  { title: "Pilha Válida de Parênteses", platform: "leetcode", platformId: "20", url: "https://leetcode.com/problems/valid-parentheses/", category: "Estruturas de Dados", difficulty: "easy", description: "Verifique se parênteses, colchetes e chaves estão balanceados.", tags: ["pilha", "strings"] },
  { title: "Implementar Fila com Pilhas", platform: "leetcode", platformId: "232", url: "https://leetcode.com/problems/implement-queue-using-stacks/", category: "Estruturas de Dados", difficulty: "easy", description: "Implemente uma fila FIFO usando duas pilhas.", tags: ["pilha", "fila"] },
  { title: "Inverter Lista Ligada", platform: "leetcode", platformId: "206", url: "https://leetcode.com/problems/reverse-linked-list/", category: "Estruturas de Dados", difficulty: "easy", description: "Inverta uma lista ligada iterativamente ou recursivamente.", tags: ["lista ligada", "recursão"] },
  { title: "Detectar Ciclo em Lista Ligada", platform: "leetcode", platformId: "141", url: "https://leetcode.com/problems/linked-list-cycle/", category: "Estruturas de Dados", difficulty: "easy", description: "Detecte se uma lista ligada possui um ciclo.", tags: ["lista ligada", "Floyd"] },
  { title: "Número de Ilhas", platform: "leetcode", platformId: "200", url: "https://leetcode.com/problems/number-of-islands/", category: "Grafos", difficulty: "medium", description: "Conte o número de ilhas usando BFS ou DFS em uma grade.", tags: ["BFS", "DFS", "grafos"] },
  { title: "BFS em Grafo", platform: "beecrowd", platformId: "1658", url: "https://www.beecrowd.com.br/judge/pt/problems/view/1658", category: "Grafos", difficulty: "medium", description: "Implemente BFS para percorrer um grafo.", tags: ["BFS", "grafos"] },

  // Recursão
  { title: "Potência de Dois", platform: "leetcode", platformId: "231", url: "https://leetcode.com/problems/power-of-two/", category: "Recursão", difficulty: "easy", description: "Determine se um número é potência de dois.", tags: ["bit manipulation", "recursão"] },
  { title: "Subconjuntos", platform: "leetcode", platformId: "78", url: "https://leetcode.com/problems/subsets/", category: "Recursão", difficulty: "medium", description: "Gere todos os possíveis subconjuntos de um array.", tags: ["backtracking", "recursão"] },
  { title: "Permutações", platform: "leetcode", platformId: "46", url: "https://leetcode.com/problems/permutations/", category: "Recursão", difficulty: "medium", description: "Gere todas as permutações possíveis de um array.", tags: ["backtracking", "recursão"] },
  { title: "Torres de Hanói", platform: "beecrowd", platformId: "1550", url: "https://www.beecrowd.com.br/judge/pt/problems/view/1550", category: "Recursão", difficulty: "medium", description: "Resolva o clássico problema das Torres de Hanói.", tags: ["recursão", "matemática"] },

  // Programação Dinâmica
  { title: "Climbing Stairs", platform: "leetcode", platformId: "70", url: "https://leetcode.com/problems/climbing-stairs/", category: "Programação Dinâmica", difficulty: "easy", description: "Quantas formas distintas de subir n degraus (1 ou 2 por vez)?", tags: ["dp", "fibonacci"] },
  { title: "Troco de Moedas", platform: "leetcode", platformId: "322", url: "https://leetcode.com/problems/coin-change/", category: "Programação Dinâmica", difficulty: "medium", description: "Encontre o número mínimo de moedas para perfazer um valor.", tags: ["dp", "BFS"] },
  { title: "Longest Common Subsequence", platform: "leetcode", platformId: "1143", url: "https://leetcode.com/problems/longest-common-subsequence/", category: "Programação Dinâmica", difficulty: "medium", description: "Encontre o comprimento da maior subsequência comum entre duas strings.", tags: ["dp", "strings"] },
  { title: "Mochila 0/1", platform: "beecrowd", platformId: "1088", url: "https://www.beecrowd.com.br/judge/pt/problems/view/1088", category: "Programação Dinâmica", difficulty: "hard", description: "Resolva o clássico problema da mochila com itens indivisíveis.", tags: ["dp", "mochila"] },

  // Matemática
  { title: "Inverter Inteiro", platform: "leetcode", platformId: "7", url: "https://leetcode.com/problems/reverse-integer/", category: "Matematica", difficulty: "medium", description: "Inverta os dígitos de um inteiro de 32 bits.", tags: ["matemática", "overflow"] },
  { title: "Raiz Quadrada Inteira", platform: "leetcode", platformId: "69", url: "https://leetcode.com/problems/sqrtx/", category: "Matematica", difficulty: "easy", description: "Compute a raiz quadrada inteira de x sem usar funções prontas.", tags: ["busca binária", "matemática"] },
  { title: "Número Primo", platform: "beecrowd", platformId: "1028", url: "https://www.beecrowd.com.br/judge/pt/problems/view/1028", category: "Matematica", difficulty: "easy", description: "Verifique se um número é primo usando o Crivo de Eratóstenes.", tags: ["primos", "matemática"] },
];

async function seed() {
  console.log("Seeding training exercises...");
  
  // Check if already seeded
  const existing = await db.select().from(trainingExercisesTable);
  if (existing.length > 0) {
    console.log(`Already have ${existing.length} exercises. Skipping seed.`);
    process.exit(0);
  }

  await db.insert(trainingExercisesTable).values(exercises.map(e => ({
    ...e,
    status: "pending" as const,
    attempts: 0,
    tags: e.tags ?? [],
  })));

  console.log(`✓ Inserted ${exercises.length} exercises`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
