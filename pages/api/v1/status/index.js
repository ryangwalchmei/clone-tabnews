function status(req, res) {
  res.status(200).json({ message: "Alunos do curso.dev são pessoas acima da média" });
}

export default status;